import { type ActionFunctionArgs, data } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"
import { generateAuthenticationOptions } from "@simplewebauthn/server"

import { setBiometricCookieSession } from "~/utils/biometric.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/authentication/generate-authentication-options/:username">,
  string
>

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { username } = params as RouteParams

  const user = await prisma.user.findUniqueOrThrow({
    where: { username },
    select: {
      passkeys: {
        select: {
          id: true,
          credentialTransports: true,
        },
      },
    },
  })

  const options = await generateAuthenticationOptions({
    rpID: process.env.RELYING_PARTY_ID ?? "",
    allowCredentials: user.passkeys.map((passkey) => ({
      id: passkey.id,
      transports: JSON.parse(passkey.credentialTransports), // ['ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb']
    })),
  })

  return data(
    {
      status: "success",
      options,
    },
    {
      headers: {
        "Set-Cookie": await setBiometricCookieSession(
          request,
          options.challenge
        ),
      },
    }
  )
}
