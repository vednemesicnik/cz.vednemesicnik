import { redirect } from 'react-router'
import { getAuthentication } from '~/utils/auth.server'
import { recordAuthLog } from '~/utils/auth-log.server'
import { checkHoneypot } from '~/utils/honeypot.server'
import { createMagicLinkUrl } from '~/utils/magic-link/create-magic-link-url'
import { consumeMagicLinkToken } from '~/utils/magic-link.server'
import { safeRedirect } from '~/utils/safe-redirect'
import { findExistingUserByEmail, signInUser } from '~/utils/sign-in.server'
import { withRedirectTo } from '~/utils/with-redirect-to'

import type { Route } from './+types/route'
import { verifyIdentityWithLink } from './utils/verify-identity-with-link.server'

export const action = async ({ request }: Route.ActionArgs) => {
  const authentication = await getAuthentication(request)

  const formData = await request.formData()

  checkHoneypot(formData)

  const token = formData.get('token')
  const email = formData.get('email')
  const redirectTo = safeRedirect(formData.get('redirectTo'))

  if (typeof token !== 'string' || typeof email !== 'string') {
    throw redirect(withRedirectTo('/administration/sign-in', redirectTo), {
      status: 303,
    })
  }

  const normalizedEmail = email.trim().toLowerCase()

  // A signed-in browser checks its identity (design 29d) and never swaps the
  // session for another one.
  if (
    authentication.sessionId !== undefined &&
    authentication.userId !== undefined
  ) {
    return verifyIdentityWithLink({
      email: normalizedEmail,
      redirectTo,
      request,
      session: {
        sessionId: authentication.sessionId,
        userId: authentication.userId,
      },
      token,
    })
  }

  // Single-use: consume (delete) the row and check validity in one step.
  const isValid = await consumeMagicLinkToken(normalizedEmail, token)

  // Expired or used by another tab between opening and clicking: back to the
  // link's page, which now says Odkaz už neplatí (20c).
  if (!isValid) {
    recordAuthLog({
      email: normalizedEmail,
      event: 'sign_in_failure',
      method: 'magic_link',
      request,
    })
    const link = new URL(
      createMagicLinkUrl({
        baseUrl: request.url,
        email: normalizedEmail,
        redirectTo,
        token,
      }),
    )
    throw redirect(link.pathname + link.search, { status: 303 })
  }

  const user = await findExistingUserByEmail(normalizedEmail)

  // The account may have been removed between request and click: the chooser
  // says so like a Google sign-in without an account (20c).
  if (user === null) {
    recordAuthLog({
      email: normalizedEmail,
      event: 'sign_in_failure',
      method: 'magic_link',
      request,
    })
    const chooser = new URL(
      withRedirectTo('/administration/sign-in', redirectTo),
      request.url,
    )
    chooser.searchParams.set('error', 'account')
    throw redirect(chooser.pathname + chooser.search, { status: 303 })
  }

  // Always throws: a redirect to `redirectTo` on success.
  return await signInUser(request, user.id, 'magic_link', { redirectTo })
}
