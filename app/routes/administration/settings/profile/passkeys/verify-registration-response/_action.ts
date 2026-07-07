import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { type ActionFunctionArgs, data } from 'react-router'

import {
  getSessionAuthCookieSession,
  getSessionAuthId,
} from '~/utils/auth.server'
import {
  getBiometricChallenge,
  getBiometricCookieSession,
} from '~/utils/biometric.server'
import { prisma } from '~/utils/db.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const sessionAuthCookieSession = await getSessionAuthCookieSession(request)
  const sessionAuthId = getSessionAuthId(sessionAuthCookieSession)

  const biometricCookieSession = await getBiometricCookieSession(request)
  const biometricChallenge = getBiometricChallenge(biometricCookieSession)

  const body = await request.json()

  const verifiedRegistrationResponse = await verifyRegistrationResponse({
    expectedChallenge: biometricChallenge ?? '',
    expectedOrigin: process.env.RELYING_PARTY_ORIGIN ?? '',
    expectedRPID: process.env.RELYING_PARTY_ID ?? '',
    response: body,
  })

  if (
    verifiedRegistrationResponse.verified &&
    verifiedRegistrationResponse.registrationInfo !== undefined
  ) {
    const { registrationInfo } = verifiedRegistrationResponse

    const session = await prisma.session.findUniqueOrThrow({
      select: { userId: true },
      where: { id: sessionAuthId },
    })

    await prisma.passkey.create({
      data: {
        credentialBackedUp: registrationInfo.credentialBackedUp,
        credentialCounter: registrationInfo.credential.counter,
        credentialDeviceType: registrationInfo.credentialDeviceType,
        credentialId: registrationInfo.credential.id,
        credentialPublicKey: Uint8Array.from(
          registrationInfo.credential.publicKey,
        ),
        credentialTransports: JSON.stringify(
          registrationInfo.credential.transports,
        ),
        user: {
          connect: {
            id: session.userId,
          },
        },
      },
    })

    return { status: 'success', verified: true }
  }

  return data({ status: 'fail', verified: false }, { status: 400 })
}
