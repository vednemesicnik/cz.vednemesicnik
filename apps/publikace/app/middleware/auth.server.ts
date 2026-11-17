import { auth, createSessionAuthScheme, requireAuth } from 'remix/middleware/auth'
import { redirect } from 'remix/response/redirect'
import { createContextKey, type RequestContext } from 'remix/router'
import { Session } from 'remix/session'

import { type AccessRefusal, decideAccess } from '../auth/access.server.ts'
import { appOrigin } from '../auth/environment.server.ts'
import {
  AUTHORIZATION_TTL_MS,
  EDITOR_SESSION_KEY,
  REFUSED_EMAIL_SESSION_KEY,
  type SignedInUntilCookie,
  type StoredEditor,
} from '../auth/session.server.ts'
import { parseStamp } from '../domain/time.ts'
import { routes } from '../routes.ts'
import { Access } from './access.server.ts'

/** The signed-in editor-in-chief, as every controller behind `requireEditor()` sees them. */
export type Editor = {
  displayName: string
  email: string
  /**
   * Read from the access list on every request rather than kept in the session, so a role
   * taken away counts from the very next request (`14b`).
   */
  isAdmin: boolean
}

/** Why this request lost its sign-in, when the ten-minute check just said no or "don't know". */
const AccessLoss = createContextKey<AccessRefusal | null>(null)

/**
 * Resolves the editor from the session, asking about access again once the last answer is ten
 * minutes old.
 *
 * - **No** (`notlisted`, `domain`): the identity leaves the session, and the address stays for
 *   the sign-in page's sentence.
 * - **Don't know** (`unavailable`): the request is refused but the session is left as it is,
 *   so the next request asks again; a blip in the membership service never signs anybody out.
 */
export function loadAuth() {
  return auth({
    schemes: [
      createSessionAuthScheme<Editor, StoredEditor>({
        invalidate(session, context) {
          if (context.get(AccessLoss) === 'unavailable') return
          session.unset(EDITOR_SESSION_KEY)
        },
        name: 'session',
        read: (session) => (session.get(EDITOR_SESSION_KEY) as StoredEditor | undefined) ?? null,
        async verify(stored, context) {
          let access = context.get(Access)
          if (access === undefined) throw new Error('loadAccess() must run before loadAuth().')
          let displayName = stored.displayName

          if (stored.authorizedUntil <= Date.now()) {
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

            displayName = decision.displayName
            context.get(Session)?.set(EDITOR_SESSION_KEY, {
              authorizedUntil: Date.now() + AUTHORIZATION_TTL_MS,
              displayName,
              email: stored.email,
            } satisfies StoredEditor)
          }

          let account = await access.directory.findAccount(stored.email)
          return { displayName, email: stored.email, isAdmin: account?.isAdmin ?? false }
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
): Promise<Response> {
  let params = new URLSearchParams({ redirectTo: returnPath(context) })
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

/** Protects a controller: an anonymous request goes to the sign-in page. */
export function requireEditor(signedInUntil: SignedInUntilCookie) {
  return requireAuth<Editor>({
    onFailure: (context) => signInRedirect(context, signedInUntil),
  })
}
