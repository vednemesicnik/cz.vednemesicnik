import { type ActionFunctionArgs, data } from 'react-router'

import { recordAuthLog } from '~/utils/auth-log.server'
import {
  deleteBiometricCookieSession,
  getBiometricChallenge,
  getBiometricCookieSession,
  getBiometricRedirectTo,
} from '~/utils/biometric.server'
import { verifyPasskeyAssertion } from '~/utils/passkey/verify-passkey-assertion.server'
import { signInUser } from '~/utils/sign-in.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const body = await request.json()

  const biometricCookieSession = await getBiometricCookieSession(request)
  const biometricChallenge = getBiometricChallenge(biometricCookieSession)
  const redirectTo = getBiometricRedirectTo(biometricCookieSession)

  const result = await verifyPasskeyAssertion({
    expectedChallenge: biometricChallenge ?? '',
    response: body,
  })

  if (result.status === 'failed') {
    recordAuthLog({
      event: 'sign_in_failure',
      method: 'passkey',
      request,
      userId: result.userId ?? undefined,
    })
    return data({ status: 'fail', verified: false }, { status: 400 })
  }

  // Create the session, set the auth cookie and redirect into administration.
  // Also clear the short-lived challenge cookie in the same response.
  const headers = new Headers({
    'Set-Cookie': await deleteBiometricCookieSession(biometricCookieSession),
  })

  return await signInUser(
    request,
    result.userId,
    'passkey',
    redirectTo,
    headers,
  )
}
