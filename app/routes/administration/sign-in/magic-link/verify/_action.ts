import { redirect } from 'react-router'
import { requireUnauthenticated } from '~/utils/auth.server'
import { recordAuthEvent } from '~/utils/auth-event.server'
import { checkHoneypot } from '~/utils/honeypot.server'
import { consumeMagicLinkToken } from '~/utils/magic-link.server'
import { findExistingUserByEmail, signInUser } from '~/utils/sign-in.server'

import type { Route } from './+types/route'

export const action = async ({ request }: Route.ActionArgs) => {
  // Enforce the auth boundary in the handler, not just the loader: a direct POST
  // must not let an already-signed-in admin consume a token and swap sessions.
  await requireUnauthenticated(request)

  const formData = await request.formData()

  checkHoneypot(formData)

  const token = formData.get('token')
  const email = formData.get('email')

  if (typeof token !== 'string' || typeof email !== 'string') {
    throw redirect('/administration/sign-in', { status: 303 })
  }

  const normalizedEmail = email.trim().toLowerCase()

  // Single-use: consume (delete) the row and check validity in one step.
  const isValid = await consumeMagicLinkToken(normalizedEmail, token)

  if (!isValid) {
    recordAuthEvent({
      email: normalizedEmail,
      event: 'sign_in_failure',
      method: 'magic_link',
      request,
    })
    throw redirect('/administration/sign-in/magic-link', { status: 303 })
  }

  const user = await findExistingUserByEmail(normalizedEmail)

  // The account may have been removed between request and click.
  if (user === null) {
    recordAuthEvent({
      email: normalizedEmail,
      event: 'sign_in_failure',
      method: 'magic_link',
      request,
    })
    throw redirect('/administration/sign-in', { status: 303 })
  }

  // Always throws: a redirect to /administration on success.
  return await signInUser(request, user.id, 'magic_link')
}
