import { generateRegistrationOptions } from '@simplewebauthn/server'
import { type ActionFunctionArgs, data, type ParamParseKey } from 'react-router'

import { setBiometricCookieSession } from '~/utils/biometric.server'

type RouteParams = Record<
  ParamParseKey<'administration/authentication/generate-registration-options/:username'>,
  string
>

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { username } = params as RouteParams

  const options = await generateRegistrationOptions({
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    rpID: process.env.RELYING_PARTY_ID ?? '',
    rpName: process.env.RELYING_PARTY_NAME ?? '',
    userName: username,
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
