import { redirect } from 'react-router'
import { requireUnauthenticated } from '~/utils/auth.server'
import { recordAuthLog } from '~/utils/auth-log.server'
import { checkHoneypot } from '~/utils/honeypot.server'
import { consumeMagicLinkToken } from '~/utils/magic-link.server'
import { safeRedirect } from '~/utils/safe-redirect'
import { findExistingUserByEmail, signInUser } from '~/utils/sign-in.server'
import { withRedirectTo } from '~/utils/with-redirect-to'

import type { Route } from './+types/route'

export const action = async ({ request }: Route.ActionArgs) => {
  // Enforce the auth boundary in the handler, not just the loader: a direct POST
  // must not let an already-signed-in admin consume a token and swap sessions.
  await requireUnauthenticated(request)

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

  // Single-use: consume (delete) the row and check validity in one step.
  const isValid = await consumeMagicLinkToken(normalizedEmail, token)

  if (!isValid) {
    recordAuthLog({
      email: normalizedEmail,
      event: 'sign_in_failure',
      method: 'magic_link',
      request,
    })
    throw redirect(
      withRedirectTo('/administration/sign-in/magic-link', redirectTo),
      { status: 303 },
    )
  }

  const user = await findExistingUserByEmail(normalizedEmail)

  // The account may have been removed between request and click.
  if (user === null) {
    recordAuthLog({
      email: normalizedEmail,
      event: 'sign_in_failure',
      method: 'magic_link',
      request,
    })
    throw redirect(withRedirectTo('/administration/sign-in', redirectTo), {
      status: 303,
    })
  }

  // Always throws: a redirect to `redirectTo` on success.
  return await signInUser(request, user.id, 'magic_link', redirectTo)
}
