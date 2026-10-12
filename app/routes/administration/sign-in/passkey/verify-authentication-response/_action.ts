import { data } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import { recordAuthLog } from '~/utils/auth-log.server'
import {
  deleteBiometricCookieSession,
  getBiometricChallenge,
  getBiometricCookieSession,
  getBiometricRedirectTo,
} from '~/utils/biometric.server'
import { verifyPasskeyAssertion } from '~/utils/passkey/verify-passkey-assertion.server'
import { rateLimitContext } from '~/utils/rate-limit.server'
import { signInUser } from '~/utils/sign-in.server'

import type { Route } from './+types/route'

export const action = async ({ request, context }: Route.ActionArgs) => {
  // A signed-in browser must not swap its session for another account's.
  await requireUnauthenticated(request)

  const biometricCookieSession = await getBiometricCookieSession(request)
  const biometricChallenge = getBiometricChallenge(biometricCookieSession)
  const redirectTo = getBiometricRedirectTo(biometricCookieSession)

  // Rate limited by the middleware (see _middleware.ts). A fetcher endpoint,
  // so the 429 is returned, not thrown.
  const limited = context.get(rateLimitContext)
  if (limited) {
    return data(
      { retryAfter: limited.retryAfter, status: 'rate-limited' as const },
      {
        headers: {
          'Set-Cookie': await deleteBiometricCookieSession(
            biometricCookieSession,
          ),
        },
        status: 429,
      },
    )
  }

  const result = await verifyPasskeyAssertion({
    expectedChallenge: biometricChallenge ?? '',
    // Unparsable JSON fails like any other bad assertion.
    response: await request.json().catch(() => null),
  })

  if (result.status === 'failed') {
    recordAuthLog({
      event: 'sign_in_failure',
      method: 'passkey',
      request,
      userId: result.userId ?? undefined,
    })
    return data({ status: 'failed' as const }, { status: 400 })
  }

  // Create the session, set the auth cookie and redirect into administration.
  // Also clear the short-lived challenge cookie in the same response.
  const headers = new Headers({
    'Set-Cookie': await deleteBiometricCookieSession(biometricCookieSession),
  })

  return await signInUser(request, result.userId, 'passkey', {
    headers,
    redirectTo,
  })
}
