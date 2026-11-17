import {
  completeAuth,
  createGoogleAuthProvider,
  finishExternalAuth,
  startExternalAuth,
} from 'remix/auth'
import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'
import { Session } from 'remix/session'

import { type VerifiedProfile, decideAccess } from '../../../auth/access.server.ts'
import { appOrigin, googleCredentials } from '../../../auth/environment.server.ts'
import {
  AUTHORIZATION_TTL_MS,
  EDITOR_SESSION_KEY,
  REFUSED_EMAIL_SESSION_KEY,
  SESSION_LIFETIME,
  type SignedInUntilCookie,
  type StoredEditor,
} from '../../../auth/session.server.ts'
import { now, stamp } from '../../../domain/time.ts'
import { Access } from '../../../middleware/access.server.ts'
import type { AppContext } from '../../../router.ts'
import { routes } from '../../../routes.ts'
import type { SignInError } from '../sign-in-page.tsx'
import { localPath } from '../controller.tsx'

let cachedProvider: ReturnType<typeof createGoogleAuthProvider> | null | undefined

/**
 * The Google OAuth client, built on first use, or `null` outside production when no client is
 * configured — then every attempt ends as `oauth`.
 */
function provider(domain: string) {
  if (cachedProvider === undefined) {
    let credentials = googleCredentials()

    cachedProvider =
      credentials === null
        ? null
        : createGoogleAuthProvider({
            authorizationParams: {
              /* A hint to Google's account chooser, not a check: a personal account can still
                 come back, which is why `decideAccess` looks at the domain again. */
              hd: domain,
              prompt: 'select_account',
            },
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            redirectUri: new URL(routes.auth.google.callback.href(), appOrigin()),
          })
  }

  return cachedProvider
}

function refuse(error: SignInError, redirectTo: string | undefined): Response {
  let params = new URLSearchParams({ error })
  if (redirectTo !== undefined) params.set('redirectTo', redirectTo)
  return redirect(`${routes.auth.signIn.href()}?${params}`, 303)
}

/** The claims this app reads off the verified ID token. */
function toProfile(claims: Record<string, unknown>): VerifiedProfile {
  return {
    email: typeof claims.email === 'string' ? claims.email : '',
    emailVerified: claims.email_verified === true,
    hostedDomain: typeof claims.hd === 'string' ? claims.hd : null,
    name: typeof claims.name === 'string' && claims.name !== '' ? claims.name : null,
  }
}

/** What happens once Google has vouched for somebody; exported so it is tested without Google. */
export async function completeGoogleSignIn(
  context: AppContext,
  signedInUntil: SignedInUntilCookie,
  claims: Record<string, unknown>,
  redirectTo: string | undefined,
): Promise<Response> {
  let access = context.get(Access)
  let decision = await decideAccess(toProfile(claims), access)

  if (!decision.allowed) {
    if (decision.reason === 'notlisted') {
      context.get(Session).set(REFUSED_EMAIL_SESSION_KEY, decision.email)
    }
    return refuse(decision.reason, redirectTo)
  }

  let at = now()
  await access.directory.recordSignIn(decision.email, decision.displayName, at)

  // Rotates the session id, so a session somebody fixed before the sign-in is worthless.
  let session = completeAuth(context)
  session.unset(REFUSED_EMAIL_SESSION_KEY)
  session.set(EDITOR_SESSION_KEY, {
    authorizedUntil: Date.now() + AUTHORIZATION_TTL_MS,
    displayName: decision.displayName,
    email: decision.email,
  } satisfies StoredEditor)

  let response = redirect(redirectTo ?? routes.home.href(), 303)
  response.headers.append(
    'Set-Cookie',
    await signedInUntil.serialize(stamp(at.add(SESSION_LIFETIME))),
  )
  return response
}

export default function createGoogleController(signedInUntil: SignedInUntilCookie) {
  return createController(routes.auth.google, {
    actions: {
      async start(context) {
        let redirectTo = localPath(context.url.searchParams.get('redirectTo'))
        let google = provider(context.get(Access).domain)
        if (google === null) return refuse('oauth', redirectTo)

        return await startExternalAuth(google, context, { returnTo: redirectTo ?? null })
      },

      async callback(context) {
        let google = provider(context.get(Access).domain)
        if (google === null) return refuse('oauth', undefined)

        let finished
        try {
          finished = await finishExternalAuth(google, context)
        } catch (error) {
          /* A cancelled consent, an expired or replayed transaction, Google being down — or a
             misconfigured client, which only this line would ever tell. The message alone, on
             one bounded line: the error object can carry the token exchange, and the text can
             come from whoever called the callback. */
          let message = error instanceof Error ? error.message : 'unknown error'
          let line = [...message]
            .map((char) => {
              let code = char.codePointAt(0) ?? 0
              let isBreaking = code < 0x20 || (code >= 0x7f && code <= 0x9f)
              return isBreaking || code === 0x2028 || code === 0x2029 ? ' ' : char
            })
            .join('')
            .slice(0, 200)
          console.error(`[auth] Google sign-in did not finish: ${line}`)
          return refuse('oauth', undefined)
        }

        return completeGoogleSignIn(
          context,
          signedInUntil,
          finished.result.profile as Record<string, unknown>,
          // `finishExternalAuth` checks it too; the redirect is guarded where it happens.
          localPath(finished.returnTo ?? null),
        )
      },
    },
  })
}
