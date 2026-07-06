import { type LoaderFunctionArgs, redirect } from 'react-router'

import { getAuthentication } from '~/utils/auth.server'
import {
  deletePendingTwoFactorCookieSession,
  getPendingTwoFactorCookieSession,
  getPendingTwoFactorUserId,
} from '~/utils/pending-two-factor.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieSession = await getPendingTwoFactorCookieSession(request)

  // Every redirect out of the TOTP step clears the pending cookie so no stale
  // pending user id / attempt counter lingers until it expires.
  const clearPendingCookie = () =>
    deletePendingTwoFactorCookieSession(cookieSession)

  const redirectToSignIn = async () =>
    redirect('/administration/sign-in', {
      headers: { 'Set-Cookie': await clearPendingCookie() },
    })

  // Already authenticated — leave the flow (and clear the pending cookie). We
  // check inline rather than via requireUnauthenticated so this exit clears the
  // cookie too.
  const { isAuthenticated } = await getAuthentication(request)
  if (isAuthenticated) {
    throw redirect('/administration', {
      headers: { 'Set-Cookie': await clearPendingCookie() },
    })
  }

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
