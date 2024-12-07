import { generateRegistrationOptions } from "@simplewebauthn/server"
import { type ActionFunctionArgs, data, type ParamParseKey } from "react-router"

import { setBiometricCookieSession } from "~/utils/biometric.server"

type RouteParams = Record<
  ParamParseKey<"administration/authentication/generate-registration-options/:username">,
  string
>

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { username } = params as RouteParams

  const options = await generateRegistrationOptions({
    rpName: process.env.RELYING_PARTY_NAME ?? "",
    rpID: process.env.RELYING_PARTY_ID ?? "",
    userName: username,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
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
