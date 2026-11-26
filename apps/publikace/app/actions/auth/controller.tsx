import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'
import { Session } from 'remix/session'

import {
  EDITOR_SESSION_KEY,
  REFUSED_EMAIL_SESSION_KEY,
  SIGNED_OUT_AT_SESSION_KEY,
  type SignedInUntilCookie,
} from '../../auth/session.server.ts'
import { atTime, now, parseStamp, stamp } from '../../domain/time.ts'
import { Access } from '../../middleware/access.server.ts'
import { routes } from '../../routes.ts'
import { SIGN_IN_ERRORS, type SignInError, SignInPage } from './sign-in-page.tsx'

/**
 * A path of this app, or nothing: `redirectTo` is only ever followed to a place here.
 *
 * Read the way a browser reads a `Location`, before and after normalising, so `/\external.test`,
 * `/..//external.test` and a control character inside the path never pass for a local path.
 */
export function localPath(value: string | null): string | undefined {
  if (value === null || !value.startsWith('/')) return undefined
  let hasControl = [...value].some((char) => char.charCodeAt(0) < 0x20 || char === '\u007f')
  if (value.startsWith('//') || value.includes('\\') || hasControl) return undefined

  try {
    let base = new URL('http://publikace.invalid')
    let url = new URL(value, base)
    if (url.origin !== base.origin) return undefined
    /* Checked again after normalising: `/..//external.test` collapses to `//external.test`, which a
       browser reads as another site. */
    let path = url.pathname + url.search + url.hash
    return path.startsWith('/') && !path.startsWith('//') ? path : undefined
  } catch {
    return undefined
  }
}

export default function createAuthController(signedInUntil: SignedInUntilCookie) {
  return createController(routes.auth, {
    actions: {
      signIn(context) {
        let session = context.get(Session)
        let params = context.url.searchParams
        let redirectTo = localPath(params.get('redirectTo'))
        let errorParam = params.get('error')
        let error = SIGN_IN_ERRORS.find((code) => code === errorParam)
        let isSignedOut = params.get('signed-out') === '1'

        // Somebody already in has nothing to do here, unless there is a refusal to read.
        if (context.auth.ok && error === undefined) {
          return redirect(redirectTo ?? routes.home.href(), 303)
        }

        let refusedEmail = session.get(REFUSED_EMAIL_SESSION_KEY)
        let signedOutAt = parseStamp(session.get(SIGNED_OUT_AT_SESSION_KEY))

        return context.render(
          <SignInPage
            domain={context.get(Access).domain}
            error={error satisfies SignInError | undefined}
            redirectTo={redirectTo}
            refusedEmail={typeof refusedEmail === 'string' ? refusedEmail : undefined}
            signedOut={isSignedOut}
            signedOutAt={signedOutAt === null ? undefined : atTime(signedOutAt)}
          />,
        )
      },

      /**
       * Leaves without asking (`10b`): nothing is lost, the app holds no unsaved work. The id is
       * rotated so the old one cannot be replayed, and the marker goes, so the next visit is not
       * mistaken for an expiry.
       */
      async signOut(context) {
        let session = context.get(Session)
        session.unset(EDITOR_SESSION_KEY)
        session.regenerateId(true)
        session.flash(SIGNED_OUT_AT_SESSION_KEY, stamp(now()))

        let response = redirect(`${routes.auth.signIn.href()}?signed-out=1`, 303)
        response.headers.append('Set-Cookie', await signedInUntil.serialize('', { maxAge: 0 }))
        return response
      },
    },
  })
}
