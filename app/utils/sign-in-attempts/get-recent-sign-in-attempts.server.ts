import { prisma } from '~/utils/db.server'
import { getUserAuthorNames } from '~/utils/emergency-sign-in-link/get-user-author-names.server'

import { type SignInAttempt, toSignInAttempt } from './to-sign-in-attempt'

const RECENT_SIGN_IN_ATTEMPTS_COUNT = 5

/**
 * Reads an account's last sign-in attempts from `AuthLog`, newest first,
 * successful and failed, without sign-outs and identity checks (design 29a,
 * 28e). Rows match by
 * `userId` or by `email`: a failed magic link carries only the email.
 *
 * @param account.userId - The account's user id.
 * @param account.email - The account's e-mail address.
 * @returns At most five attempts, ready for `AdminSignInAttempts`.
 */
export const getRecentSignInAttempts = async ({
  userId,
  email,
}: {
  userId: string
  email: string
}): Promise<SignInAttempt[]> => {
  const rows = await prisma.authLog.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      emergencySignInLinkId: true,
      event: true,
      id: true,
      method: true,
    },
    take: RECENT_SIGN_IN_ATTEMPTS_COUNT,
    where: {
      event: {
        in: ['sign_in_success', 'sign_in_failure', 'two_factor_failure'],
      },
      OR: [{ userId }, { email }],
    },
  })

  // An emergency link's attempt names who issued it (#578, design 28e, 29a).
  const linkIds = rows.flatMap((row) => row.emergencySignInLinkId ?? [])
  const links =
    linkIds.length === 0
      ? []
      : await prisma.emergencySignInLink.findMany({
          select: { id: true, issuedById: true },
          where: { id: { in: linkIds } },
        })
  const issuerIds = new Map(links.map((link) => [link.id, link.issuedById]))
  const issuerNames = await getUserAuthorNames([...issuerIds.values()])

  return rows.flatMap((row) => {
    const issuerId =
      row.emergencySignInLinkId === null
        ? undefined
        : issuerIds.get(row.emergencySignInLinkId)
    const issuerName =
      issuerId === undefined ? null : (issuerNames.get(issuerId) ?? null)

    return toSignInAttempt(row, issuerName) ?? []
  })
}
