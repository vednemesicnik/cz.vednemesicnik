import { type LoaderFunctionArgs, redirect } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import {
  deletePendingTwoFactorCookieSession,
  getPendingTwoFactorCookieSession,
  getPendingTwoFactorUserId,
} from '~/utils/pending-two-factor.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUnauthenticated(request)

  const cookieSession = await getPendingTwoFactorCookieSession(request)

  // Any redirect out of the TOTP step clears the pending cookie so no stale
  // pending user id / attempt counter lingers until it expires.
  const redirectToSignIn = async () =>
    redirect('/administration/sign-in', {
      headers: {
        'Set-Cookie': await deletePendingTwoFactorCookieSession(cookieSession),
      },
    })

  // Break-glass: the whole password path is gated behind the flag.
  if (process.env.ALLOW_PASSWORD_SIGN_IN !== 'true') {
    throw await redirectToSignIn()
  }

  // Reachable only mid-sign-in, i.e. with a valid pending-2FA cookie.
  const userId = getPendingTwoFactorUserId(cookieSession)

  if (userId === undefined) {
    throw await redirectToSignIn()
  }

  return null
}
