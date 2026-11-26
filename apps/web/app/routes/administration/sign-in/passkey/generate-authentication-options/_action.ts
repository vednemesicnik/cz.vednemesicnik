import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { type ActionFunctionArgs, data } from 'react-router'

import { setBiometricCookieSession } from '~/utils/biometric.server'
import { safeRedirect } from '~/utils/safe-redirect'

export const action = async ({ request }: ActionFunctionArgs) => {
  // Carried through the ceremony so verification can return the user to the page
  // they came from; sanitized here and again in signInUser (defense-in-depth).
  const formData = await request.formData()
  const redirectTo = safeRedirect(formData.get('redirectTo'))

  const options = await generateAuthenticationOptions({
    // Usernameless / discoverable login: the authenticator presents its own
    // resident credentials, so the request is not scoped to a specific user.
    allowCredentials: [],
    rpID: process.env.RELYING_PARTY_ID ?? '',
    userVerification: 'required',
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
          redirectTo,
        ),
      },
    },
  )
}
