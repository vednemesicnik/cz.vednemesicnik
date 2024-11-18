import { type ActionFunctionArgs, json } from "@remix-run/node"
import { verifyRegistrationResponse } from "@simplewebauthn/server"

import {
  getSessionAuthCookieSession,
  getSessionAuthId,
} from "~/utils/auth.server"
import {
  getBiometricChallenge,
  getBiometricCookieSession,
} from "~/utils/biometric.server"
import { prisma } from "~/utils/db.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const sessionAuthCookieSession = await getSessionAuthCookieSession(request)
  const sessionAuthId = getSessionAuthId(sessionAuthCookieSession)

  const biometricCookieSession = await getBiometricCookieSession(request)
  const biometricChallenge = getBiometricChallenge(biometricCookieSession)

  const body = await request.json()

  const verifiedRegistrationResponse = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: biometricChallenge ?? "",
    expectedOrigin: process.env.RELYING_PARTY_ORIGIN ?? "",
    expectedRPID: process.env.RELYING_PARTY_ID ?? "",
  })

  if (
    verifiedRegistrationResponse.verified &&
    verifiedRegistrationResponse.registrationInfo !== undefined
  ) {
    const { registrationInfo } = verifiedRegistrationResponse

    const session = await prisma.session.findUniqueOrThrow({
      where: { id: sessionAuthId },
      select: { userId: true },
    })

    await prisma.passkey.create({
      data: {
        credentialId: registrationInfo.credential.id,
        credentialCounter: registrationInfo.credential.counter,
        credentialTransports: JSON.stringify(
          registrationInfo.credential.transports
        ),
        credentialPublicKey: Buffer.from(registrationInfo.credential.publicKey),
        credentialDeviceType: registrationInfo.credentialDeviceType,
        credentialBackedUp: registrationInfo.credentialBackedUp,
        user: {
          connect: {
            id: session.userId,
          },
        },
      },
    })

    return json({ status: "success", verified: true })
  }

  return json({ status: "fail", verified: false }, { status: 400 })
}
