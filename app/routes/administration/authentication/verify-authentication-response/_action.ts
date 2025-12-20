import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { type ActionFunctionArgs, data } from 'react-router'

import {
  getBiometricChallenge,
  getBiometricCookieSession,
} from '~/utils/biometric.server'
import { prisma } from '~/utils/db.server'

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

  if (verifiedAuthenticationResponse.verified) {
    const { authenticationInfo } = verifiedAuthenticationResponse

    await prisma.passkey.update({
      data: {
        credentialCounter: authenticationInfo.newCounter,
      },
      where: { credentialId: authenticationInfo.credentialID },
    })

    return { status: 'success', verified: true }
  }

  return data({ status: 'fail', verified: false }, { status: 400 })
}
