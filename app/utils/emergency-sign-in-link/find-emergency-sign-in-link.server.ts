import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'

/**
 * Reads an emergency sign-in link by its token (#578), whether or not it still
 * works: the confirmation page needs the account and the issuer, and a failed
 * sign-in with a used, replaced or expired link is still tied to its account.
 *
 * @param token - The raw token from the link.
 * @returns The link with its account's e-mail and `isValid`, or `null` for an
 *   unknown token.
 */
export const findEmergencySignInLink = async (token: string) => {
  const link = await prisma.emergencySignInLink.findUnique({
    select: {
      expiresAt: true,
      id: true,
      issuedById: true,
      replacedAt: true,
      usedAt: true,
      user: { select: { email: true } },
      userId: true,
    },
    where: { tokenHash: getContentHash(token) },
  })

  if (link === null) return null

  return {
    email: link.user.email,
    id: link.id,
    issuedById: link.issuedById,
    isValid:
      link.usedAt === null &&
      link.replacedAt === null &&
      link.expiresAt > new Date(),
    userId: link.userId,
  }
}
