import { Auth, auth, createSessionAuthScheme, requireAuth } from 'remix/middleware/auth'
import { redirect } from 'remix/response/redirect'
import { createContextKey, type RequestContext } from 'remix/router'
import { Session } from 'remix/session'

import { type AccessRefusal, decideAccess } from '../auth/access.server.ts'
import { appOrigin } from '../auth/environment.server.ts'
import {
  EDITOR_SESSION_KEY,
  REFUSED_EMAIL_SESSION_KEY,
  type SignedInUntilCookie,
  type StoredEditor,
  storedPerson,
} from '../auth/session.server.ts'
import { parseStamp } from '../domain/time.ts'
import { routes } from '../routes.ts'
import { renderEditorsOnly } from '../actions/proofreading/editors-only-page.tsx'
import { Access } from './access.server.ts'

/** The signed-in person, as every controller behind `requireEditor()` or `requireProofreading()` sees them. */
export type Person = {
  displayName: string
  email: string
  /**
   * Read from the access list on every request rather than kept in the session, so a role
   * taken away counts from the very next request (`14b`).
   */
  isAdmin: boolean
  /** In Přístup: every screen of the editors-in-chief. Re-checked every ten minutes. */
  isEditor: boolean
  /** The proofreaders' address or a member of it: the page Korektura (`10d`). Re-checked as above. */
  isProofreader: boolean
}

/** Why this request lost its sign-in, when the ten-minute check just said no or "don't know". */
const AccessLoss = createContextKey<AccessRefusal | null>(null)

/**
 * Resolves the person from the session, asking about access again once the last answer is ten
 * minutes old, or one minute when it rested on a service that did not reply.
 *
 * - **No** (`notlisted`, `domain`): the identity leaves the session, and the address stays for
 *   the sign-in page's sentence.
 * - **Don't know** (`unavailable`): the request is refused but the session is left as it is,
 *   so the next request asks again; a blip in the membership service never signs anybody out.
 */
export function loadAuth() {
  return auth({
    schemes: [
      createSessionAuthScheme<Person, StoredEditor>({
        invalidate(session, context) {
          if (context.get(AccessLoss) === 'unavailable') return
          session.unset(EDITOR_SESSION_KEY)
        },
        name: 'session',
        read: (session) => (session.get(EDITOR_SESSION_KEY) as StoredEditor | undefined) ?? null,
        async verify(stored, context) {
          let access = context.get(Access)
          if (access === undefined) throw new Error('loadAccess() must run before loadAuth().')
          let current = stored
          let hasRoles = stored.isEditor !== undefined && stored.isProofreader !== undefined

          if (stored.authorizedUntil <= Date.now() || !hasRoles) {
            let decision = await decideAccess(
              {
                email: stored.email,
                // Settled at sign-in; this asks about the list and the groups again.
                emailVerified: true,
                hostedDomain: stored.email.split('@')[1] ?? null,
                name: stored.displayName,
              },
              access,
            )

            if (!decision.allowed) {
              context.set(AccessLoss, decision.reason)
              if (decision.reason !== 'unavailable') {
                context.get(Session)?.set(REFUSED_EMAIL_SESSION_KEY, decision.email)
              }
              return null
            }

            current = storedPerson(decision)
            context.get(Session)?.set(EDITOR_SESSION_KEY, current)
          }

          let isEditor = current.isEditor === true
          let account = isEditor ? await access.directory.findAccount(stored.email) : null
          return {
            displayName: current.displayName,
            email: stored.email,
            isAdmin: account?.isAdmin ?? false,
            isEditor,
            isProofreader: current.isProofreader === true,
          }
        },
      }),
    ],
  })
}

/**
 * Where a refused request should come back to after signing in.
 *
 * A page asked for with `GET` is itself. A form sent with `POST` cannot be repeated by a
 * redirect, so it is the page the form was on, when the browser said so and it is ours
 * (`10a`, `expired`: the action is dropped, the page is not).
 */
function returnPath(context: RequestContext): string {
  if (context.method === 'GET' || context.method === 'HEAD') {
    return context.url.pathname + context.url.search
  }

  let referer = context.request.headers.get('Referer')
  if (referer === null) return routes.home.href()

  try {
    let from = new URL(referer)
    // Against the configured origin: behind a TLS-terminating proxy the request's own URL says
    // `http:` while the browser sent `https:`.
    return from.origin === appOrigin() ? from.pathname + from.search : routes.home.href()
  } catch {
    return routes.home.href()
  }
}

/**
 * The answer to a request that needs a signed-in editor and has none: the sign-in page, with
 * where it was headed and the reason when there is one to tell. `csrf()` gives the same answer
 * to a form whose session expired with its token, so an expiry mid-submit reads as one.
 */
export async function signInRedirect(
  context: RequestContext,
  signedInUntil: SignedInUntilCookie,
  returnTo?: string,
): Promise<Response> {
  let params = new URLSearchParams({ redirectTo: returnTo ?? returnPath(context) })
  let headers = new Headers()

  let loss = context.get(AccessLoss)
  let until = parseStamp(await signedInUntil.parse(context.request.headers.get('Cookie')))
  if (loss !== null) {
    params.set('error', loss)
    // A refusal is not an expiry: the marker goes, so a later visit is not taken for one.
    if (loss !== 'unavailable' && until !== null) {
      headers.append('Set-Cookie', await signedInUntil.serialize('', { maxAge: 0 }))
    }
  } else if (until !== null && Temporal.Instant.compare(until, Temporal.Now.instant()) <= 0) {
    params.set('error', 'expired')
    // Said once: the next visit without a session is a plain one.
    headers.append('Set-Cookie', await signedInUntil.serialize('', { maxAge: 0 }))
  }

  let response = redirect(`${routes.auth.signIn.href()}?${params}`, 303)
  for (let cookie of headers.getSetCookie()) response.headers.append('Set-Cookie', cookie)
  return response
}

/**
 * Protects the page Korektura: an editor-in-chief or a proofreader may in, and an anonymous
 * request goes to the sign-in page.
 */
export function requireProofreading(signedInUntil: SignedInUntilCookie) {
  return requireAuth<Person>({
    onFailure: (context) => signInRedirect(context, signedInUntil),
  })
}

/**
 * Protects a screen of the editors-in-chief: an anonymous request goes to the sign-in page, and
 * a proofreader who is not an editor-in-chief is refused in place with 403, at the address they
 * asked for (`10d`). A form they post writes nothing and gets the same page.
 *
 * `returnTo` replaces the address it would come back to, for a route that cannot be visited
 * twice: the return from Google carries a code that is spent once used.
 */
export function requireEditor(signedInUntil: SignedInUntilCookie, returnTo?: string) {
  let signedIn = requireAuth<Person>({
    onFailure: (context) => signInRedirect(context, signedInUntil, returnTo),
  })
  let middleware: typeof signedIn = (context, next) =>
    signedIn(context, () => {
      let state = context.get(Auth)
      let person = state?.ok === true ? (state.identity as Person) : null
      return person?.isEditor === true
        ? next()
        : Promise.resolve(renderEditorsOnly(context, person))
    })
  return middleware
}
