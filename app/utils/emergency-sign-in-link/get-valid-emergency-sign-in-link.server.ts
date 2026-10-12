import { prisma } from '~/utils/db.server'

/**
 * Reads the account's emergency sign-in link that still works (#578, design
 * 28e): the row „Nouzový odkaz · platí do …“ and the dialog's sentence about
 * the previous link. Issuing replaces the previous link, so at most one is
 * valid; the newest wins all the same.
 *
 * @param userId - The account.
 * @returns The link's times and issuer, or `null` when none works.
 */
export const getValidEmergencySignInLink = (userId: string) =>
  prisma.emergencySignInLink.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, expiresAt: true, issuedById: true },
    where: {
      expiresAt: { gt: new Date() },
      replacedAt: null,
      usedAt: null,
      userId,
    },
  })
