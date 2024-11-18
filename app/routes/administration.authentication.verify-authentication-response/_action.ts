import { type ActionFunctionArgs, json } from "@remix-run/node"
import { verifyAuthenticationResponse } from "@simplewebauthn/server"

import {
  getBiometricChallenge,
  getBiometricCookieSession,
} from "~/utils/biometric.server"
import { prisma } from "~/utils/db.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const body = await request.json()

  const biometricCookieSession = await getBiometricCookieSession(request)
  const biometricChallenge = getBiometricChallenge(biometricCookieSession)

  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: body.id },
    select: {
      credentialId: true,
      credentialPublicKey: true,
      credentialCounter: true,
      credentialTransports: true,
    },
  })

  if (passkey === null) {
    return json({ status: "fail", verified: false }, { status: 400 })
  }

  const verifiedAuthenticationResponse = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: biometricChallenge ?? "",
    expectedOrigin: process.env.RELYING_PARTY_ORIGIN ?? "",
    expectedRPID: process.env.RELYING_PARTY_ID ?? "",
    credential: {
      id: passkey.credentialId,
      publicKey: passkey.credentialPublicKey,
      counter: Number(passkey.credentialCounter),
      transports: JSON.parse(passkey.credentialTransports),
    },
  })

  if (verifiedAuthenticationResponse.verified) {
    const { authenticationInfo } = verifiedAuthenticationResponse

    await prisma.passkey.update({
      where: { credentialId: authenticationInfo.credentialID },
      data: {
        credentialCounter: authenticationInfo.newCounter,
      },
    })

    return json({ status: "success", verified: true })
  }

  return json({ status: "fail", verified: false }, { status: 400 })
}
