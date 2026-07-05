import { type LoaderFunctionArgs, redirect } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import {
  deletePendingTwoFactorCookieSession,
  getPendingTwoFactorCookieSession,
  getPendingTwoFactorUserId,
} from '~/utils/pending-two-factor.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUnauthenticated(request)

  // Break-glass: the whole password path is gated behind the flag.
  if (process.env.ALLOW_PASSWORD_SIGN_IN !== 'true') {
    throw redirect('/administration/sign-in')
  }

  // Reachable only mid-sign-in, i.e. with a valid pending-2FA cookie.
  const cookieSession = await getPendingTwoFactorCookieSession(request)
  const userId = getPendingTwoFactorUserId(cookieSession)

  if (userId === undefined) {
    // Clear any lingering (stale/partial) pending cookie on the way out.
    throw redirect('/administration/sign-in', {
      headers: {
        'Set-Cookie': await deletePendingTwoFactorCookieSession(cookieSession),
      },
    })
  }

  return null
}
