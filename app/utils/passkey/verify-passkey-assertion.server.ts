import {
  type AuthenticationResponseJSON,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'

import { prisma } from '~/utils/db.server'

type PasskeyAssertionResult =
  | { status: 'verified'; userId: string }
  | { status: 'failed'; userId: string | null }

/**
 * Verifies a WebAuthn assertion against a stored passkey. On success it saves
 * the authenticator's new signature counter (replay protection) and the last
 * use Settings shows as „naposledy“ (design 29a).
 *
 * @param args.response - The assertion the browser returned.
 * @param args.expectedChallenge - The challenge issued for this ceremony.
 * @param args.userId - When given, only this user's passkeys are accepted
 *   (the identity check); any other credential fails.
 * @returns `verified` with the passkey's user, or `failed` with the user when
 *   the credential is known.
 */
export const verifyPasskeyAssertion = async ({
  response,
  expectedChallenge,
  userId,
}: {
  response: AuthenticationResponseJSON
  expectedChallenge: string
  userId?: string
}): Promise<PasskeyAssertionResult> => {
  // The body comes straight from the client; a payload without an id is a
  // failed attempt, not a 500.
  if (typeof response?.id !== 'string') {
    return { status: 'failed', userId: null }
  }

  const passkey = await prisma.passkey.findUnique({
    select: {
      credentialCounter: true,
      credentialId: true,
      credentialPublicKey: true,
      credentialTransports: true,
      userId: true,
    },
    where: { credentialId: response.id },
  })

  if (passkey === null) {
    return { status: 'failed', userId: null }
  }

  if (userId !== undefined && passkey.userId !== userId) {
    return { status: 'failed', userId }
  }

  let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>
  try {
    verification = await verifyAuthenticationResponse({
      credential: {
        counter: Number(passkey.credentialCounter),
        id: passkey.credentialId,
        publicKey: passkey.credentialPublicKey,
        transports: JSON.parse(passkey.credentialTransports),
      },
      expectedChallenge,
      expectedOrigin: process.env.RELYING_PARTY_ORIGIN ?? '',
      expectedRPID: process.env.RELYING_PARTY_ID ?? '',
      requireUserVerification: true,
      response,
    })
  } catch (error) {
    // A malformed client payload / unexpected WebAuthn response throws here;
    // treat it as a failed attempt rather than a 500 so it is audited too.
    console.error(
      '[passkey] authentication response verification failed',
      error,
    )
    return { status: 'failed', userId: passkey.userId }
  }

  if (!verification.verified) {
    return { status: 'failed', userId: passkey.userId }
  }

  await prisma.passkey.update({
    data: {
      credentialCounter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    },
    where: { credentialId: passkey.credentialId },
  })

  return { status: 'verified', userId: passkey.userId }
}
