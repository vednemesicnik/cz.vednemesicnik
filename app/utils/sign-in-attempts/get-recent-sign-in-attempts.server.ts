import { prisma } from '~/utils/db.server'

import { type SignInAttempt, toSignInAttempt } from './to-sign-in-attempt'

const RECENT_SIGN_IN_ATTEMPTS_COUNT = 5

/**
 * Reads an account's last sign-in attempts from `AuthLog`, newest first,
 * successful and failed, without sign-outs (design 29a, 28e). Rows match by
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
    select: { createdAt: true, event: true, id: true, method: true },
    take: RECENT_SIGN_IN_ATTEMPTS_COUNT,
    where: {
      event: { not: 'sign_out' },
      OR: [{ userId }, { email }],
    },
  })

  return rows.flatMap((row) => toSignInAttempt(row) ?? [])
}
