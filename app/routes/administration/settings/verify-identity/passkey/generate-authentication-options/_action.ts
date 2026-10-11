import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { type ActionFunctionArgs, data } from 'react-router'

import { requireSession } from '~/utils/auth.server'
import { setBiometricCookieSession } from '~/utils/biometric.server'
import { prisma } from '~/utils/db.server'

// Starts the identity check with a passkey (design 29d): unlike sign-in, the
// request names the signed-in user's own passkeys, so the browser offers no other.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { userId } = await requireSession(request)

  const passkeys = await prisma.passkey.findMany({
    select: { credentialId: true, credentialTransports: true },
    where: { userId },
  })

  const options = await generateAuthenticationOptions({
    allowCredentials: passkeys.map((passkey) => ({
      id: passkey.credentialId,
      transports: JSON.parse(passkey.credentialTransports),
    })),
    rpID: process.env.RELYING_PARTY_ID ?? '',
    userVerification: 'required',
  })

  return data(
    { options, status: 'success' as const },
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
