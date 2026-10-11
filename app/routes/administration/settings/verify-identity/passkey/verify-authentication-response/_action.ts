import { data } from 'react-router'

import { requireSession } from '~/utils/auth.server'
import { recordAuthLog } from '~/utils/auth-log.server'
import {
  deleteBiometricCookieSession,
  getBiometricChallenge,
  getBiometricCookieSession,
} from '~/utils/biometric.server'
import { markSessionAuthenticated } from '~/utils/identity-check/mark-session-authenticated.server'
import { verifyPasskeyAssertion } from '~/utils/passkey/verify-passkey-assertion.server'
import { rateLimitContext } from '~/utils/rate-limit.server'

import type { Route } from './+types/route'

// Finishes the identity check with a passkey (design 29d): a passkey of the
// signed-in user marks the current session as freshly authenticated. A fetcher
// endpoint, so every outcome is returned, never thrown.
export const action = async ({ request, context }: Route.ActionArgs) => {
  const { sessionId, userId } = await requireSession(request)

  const biometricCookieSession = await getBiometricCookieSession(request)
  const headers = {
    'Set-Cookie': await deleteBiometricCookieSession(biometricCookieSession),
  }

  const limited = context.get(rateLimitContext)
  if (limited) {
    return data(
      { retryAfter: limited.retryAfter, status: 'rate-limited' as const },
      { headers, status: 429 },
    )
  }

  const result = await verifyPasskeyAssertion({
    expectedChallenge: getBiometricChallenge(biometricCookieSession) ?? '',
    response: await request.json(),
    userId,
  })

  if (result.status === 'failed') {
    recordAuthLog({
      event: 'identity_check_failure',
      method: 'passkey',
      request,
      userId,
    })
    return data({ status: 'failed' as const }, { headers, status: 400 })
  }

  await markSessionAuthenticated(sessionId)
  recordAuthLog({
    event: 'identity_check_success',
    method: 'passkey',
    request,
    userId,
  })

  return data({ status: 'verified' as const }, { headers })
}
