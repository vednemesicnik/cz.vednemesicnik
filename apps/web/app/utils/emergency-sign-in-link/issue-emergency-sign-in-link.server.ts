import { randomBytes } from 'node:crypto'

import { EMERGENCY_SIGN_IN_LINK_CONFIG } from '~/config/emergency-sign-in-link-config'
import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'

/**
 * Issues an emergency sign-in link for an account (#578): in one transaction,
 * marks the account's links that still work as replaced and stores the new
 * one's SHA-256 hash with its issuer. The raw token exists only in the result.
 *
 * @param args.userId - The account the link signs in to.
 * @param args.issuedById - The Owner or Administrator issuing it.
 * @returns The raw token for the link and when it stops working.
 */
export const issueEmergencySignInLink = async ({
  userId,
  issuedById,
}: {
  userId: string
  issuedById: string
}) => {
  const token = randomBytes(EMERGENCY_SIGN_IN_LINK_CONFIG.tokenBytes).toString(
    'base64url',
  )
  const now = new Date()
  const expiresAt = new Date(
    now.getTime() + EMERGENCY_SIGN_IN_LINK_CONFIG.ttlMs,
  )

  await prisma.$transaction([
    prisma.emergencySignInLink.updateMany({
      data: { replacedAt: now },
      where: {
        expiresAt: { gt: now },
        replacedAt: null,
        usedAt: null,
        userId,
      },
    }),
    prisma.emergencySignInLink.create({
      data: {
        expiresAt,
        issuedById,
        tokenHash: getContentHash(token),
        userId,
      },
    }),
  ])

  return { expiresAt, token }
}
