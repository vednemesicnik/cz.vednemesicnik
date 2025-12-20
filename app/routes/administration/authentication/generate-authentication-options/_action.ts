import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { type ActionFunctionArgs, data, type ParamParseKey } from 'react-router'

import { setBiometricCookieSession } from '~/utils/biometric.server'
import { prisma } from '~/utils/db.server'

type RouteParams = Record<
  ParamParseKey<'administration/authentication/generate-authentication-options/:username'>,
  string
>

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { username } = params as RouteParams

  const user = await prisma.user.findUniqueOrThrow({
    select: {
      passkeys: {
        select: {
          credentialTransports: true,
          id: true,
        },
      },
    },
    where: { username },
  })

  const options = await generateAuthenticationOptions({
    allowCredentials: user.passkeys.map((passkey) => ({
      id: passkey.id,
      transports: JSON.parse(passkey.credentialTransports), // ['ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb']
    })),
    rpID: process.env.RELYING_PARTY_ID ?? '',
  })

  return data(
    {
      options,
      status: 'success',
    },
    {
      headers: {
        'Set-Cookie': await setBiometricCookieSession(
          request,
          options.challenge,
        ),
      },
    },
  )
}
