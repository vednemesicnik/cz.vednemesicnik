import { redirect } from 'react-router'

import { recordAuthLog } from '~/utils/auth-log.server'
import { isLinkForUser } from '~/utils/identity-check/is-link-for-user.server'
import { rotateAuthenticatedSession } from '~/utils/identity-check/rotate-authenticated-session.server'
import { createMagicLinkUrl } from '~/utils/magic-link/create-magic-link-url'
import { consumeMagicLinkToken } from '~/utils/magic-link.server'

/**
 * The confirm click on a sign-in link in a browser that is already signed in:
 * the identity check of design 29d. The link of the signed-in account swaps
 * the session for a freshly authenticated one of the same user; it never
 * signs in another account. A link of another account is refused and left
 * unused (20c).
 *
 * @param args.request - The confirm request.
 * @param args.session - The browser's session.
 * @param args.email - The e-mail the link was issued for.
 * @param args.token - The link's token.
 * @param args.redirectTo - Where the link lands after the check.
 * @returns Never: a redirect to `redirectTo`, or back to the link's page, which
 *   then shows why it was refused.
 */
export const verifyIdentityWithLink = async ({
  request,
  session,
  email,
  token,
  redirectTo,
}: {
  request: Request
  session: { sessionId: string; userId: string }
  email: string
  token: string
  redirectTo: string
}): Promise<never> => {
  const { sessionId, userId } = session

  const backToLink = () => {
    recordAuthLog({
      event: 'identity_check_failure',
      method: 'magic_link',
      request,
      userId,
    })
    const link = new URL(
      createMagicLinkUrl({
        baseUrl: request.url,
        email,
        redirectTo,
        token,
      }),
    )

    return redirect(link.pathname + link.search, { status: 303 })
  }

  // Checked before consuming, so another account's link stays usable.
  if (!(await isLinkForUser(email, userId))) throw backToLink()

  if (!(await consumeMagicLinkToken(email, token))) throw backToLink()

  const sessionCookie = await rotateAuthenticatedSession({ request, sessionId })
  recordAuthLog({
    event: 'identity_check_success',
    method: 'magic_link',
    request,
    userId,
  })

  throw redirect(redirectTo, {
    headers: { 'Set-Cookie': sessionCookie },
    status: 303,
  })
}
