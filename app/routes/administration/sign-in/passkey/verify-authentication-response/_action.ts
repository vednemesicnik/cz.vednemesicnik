import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { type ActionFunctionArgs, data } from 'react-router'

import {
  deleteBiometricCookieSession,
  getBiometricChallenge,
  getBiometricCookieSession,
} from '~/utils/biometric.server'
import { prisma } from '~/utils/db.server'
import { signInUser } from '~/utils/sign-in.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const body = await request.json()

  const biometricCookieSession = await getBiometricCookieSession(request)
  const biometricChallenge = getBiometricChallenge(biometricCookieSession)

  const passkey = await prisma.passkey.findUnique({
    select: {
      credentialCounter: true,
      credentialId: true,
      credentialPublicKey: true,
      credentialTransports: true,
      userId: true,
    },
    where: { credentialId: body.id },
  })

  if (passkey === null) {
    return data({ status: 'fail', verified: false }, { status: 400 })
  }

  const verifiedAuthenticationResponse = await verifyAuthenticationResponse({
    credential: {
      counter: Number(passkey.credentialCounter),
      id: passkey.credentialId,
      publicKey: passkey.credentialPublicKey,
      transports: JSON.parse(passkey.credentialTransports),
    },
    expectedChallenge: biometricChallenge ?? '',
    expectedOrigin: process.env.RELYING_PARTY_ORIGIN ?? '',
    expectedRPID: process.env.RELYING_PARTY_ID ?? '',
    response: body,
  })

  if (!verifiedAuthenticationResponse.verified) {
    return data({ status: 'fail', verified: false }, { status: 400 })
  }

  // Replay protection: persist the authenticator's new signature counter.
  await prisma.passkey.update({
    data: {
      credentialCounter:
        verifiedAuthenticationResponse.authenticationInfo.newCounter,
    },
    where: { credentialId: passkey.credentialId },
  })

  // Create the session, set the auth cookie and redirect into administration.
  // Also clear the short-lived challenge cookie in the same response.
  const headers = new Headers({
    'Set-Cookie': await deleteBiometricCookieSession(biometricCookieSession),
  })

  return await signInUser(request, passkey.userId, undefined, headers)
}
