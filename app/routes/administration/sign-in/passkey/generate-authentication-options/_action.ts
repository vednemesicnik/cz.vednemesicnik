import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { type ActionFunctionArgs, data } from 'react-router'

import { setBiometricCookieSession } from '~/utils/biometric.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const options = await generateAuthenticationOptions({
    // Usernameless / discoverable login: the authenticator presents its own
    // resident credentials, so the request is not scoped to a specific user.
    allowCredentials: [],
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
