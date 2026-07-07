import { generateRegistrationOptions } from '@simplewebauthn/server'
import { type ActionFunctionArgs, data } from 'react-router'

import {
  getSessionAuthCookieSession,
  getSessionAuthId,
} from '~/utils/auth.server'
import { setBiometricCookieSession } from '~/utils/biometric.server'
import { prisma } from '~/utils/db.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const sessionAuthCookieSession = await getSessionAuthCookieSession(request)
  const sessionAuthId = getSessionAuthId(sessionAuthCookieSession)

  // Registration is settings-only: the user is authenticated, so the username
  // and existing credentials come from the session rather than a route param.
  const session = await prisma.session.findUniqueOrThrow({
    select: {
      user: {
        select: {
          passkeys: {
            select: { credentialId: true, credentialTransports: true },
          },
          username: true,
        },
      },
    },
    where: { id: sessionAuthId },
  })

  const options = await generateRegistrationOptions({
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    // Block registering an authenticator that is already enrolled.
    excludeCredentials: session.user.passkeys.map((passkey) => ({
      id: passkey.credentialId,
      transports: JSON.parse(passkey.credentialTransports),
    })),
    rpID: process.env.RELYING_PARTY_ID ?? '',
    rpName: process.env.RELYING_PARTY_NAME ?? '',
    userName: session.user.username,
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
