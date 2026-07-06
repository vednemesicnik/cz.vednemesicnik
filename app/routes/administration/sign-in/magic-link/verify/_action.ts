import { redirect } from 'react-router'

import { checkHoneypot } from '~/utils/honeypot.server'
import { consumeMagicLinkToken } from '~/utils/magic-link.server'
import { findExistingUserByEmail, signInUser } from '~/utils/sign-in.server'

import type { Route } from './+types/route'

export const action = async ({ request }: Route.ActionArgs) => {
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
    throw redirect('/administration/sign-in/magic-link', { status: 303 })
  }

  const user = await findExistingUserByEmail(normalizedEmail)

  // The account may have been removed between request and click.
  if (user === null) {
    throw redirect('/administration/sign-in', { status: 303 })
  }

  // Always throws: a redirect to /administration on success.
  return await signInUser(request, user.id)
}
