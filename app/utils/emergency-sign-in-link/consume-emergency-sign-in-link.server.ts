import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'

/**
 * Atomically uses up an emergency sign-in link (#578): marks it used only when
 * it is unused, not replaced and not expired. Deciding on the update count, not
 * a separate read, makes the link single-use under concurrency.
 *
 * @param token - The raw token from the link.
 * @returns `true` when exactly this call used the link.
 */
export const consumeEmergencySignInLink = async (token: string) => {
  const now = new Date()

  const { count } = await prisma.emergencySignInLink.updateMany({
    data: { usedAt: now },
    where: {
      expiresAt: { gt: now },
      replacedAt: null,
      tokenHash: getContentHash(token),
      usedAt: null,
    },
  })

  return count === 1
}
