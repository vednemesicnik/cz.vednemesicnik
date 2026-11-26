import { GOOGLE_PROVIDER_NAME } from '~/config/connection-config'
import { countUnusedBackupCodes } from '~/utils/backup-codes.server'
import { prisma } from '~/utils/db.server'
import { getUserTwoFactor } from '~/utils/two-factor.server'

export type SignInMethodSummary = {
  hasPassword: boolean
  isTwoFactorEnabled: boolean
  unusedBackupCodesCount: number
  passkeyCount: number
  isGoogleLinked: boolean
}

/**
 * Reads how an account can sign in, the facts both Settings (design 29a) and
 * the user detail (28e) show, so the two screens cannot drift apart.
 *
 * @param userId - The account's user id.
 * @returns The account's sign-in methods; `unusedBackupCodesCount` is `0`
 *   while two-factor authentication is off.
 */
export const getSignInMethodSummary = async (
  userId: string,
): Promise<SignInMethodSummary> => {
  const [user, twoFactor] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      select: {
        _count: { select: { passkeys: true } },
        connections: {
          select: { id: true },
          where: { providerName: GOOGLE_PROVIDER_NAME },
        },
        password: { select: { userId: true } },
      },
      where: { id: userId },
    }),
    getUserTwoFactor(userId),
  ])

  const isTwoFactorEnabled = twoFactor !== null

  return {
    hasPassword: user.password !== null,
    isGoogleLinked: user.connections.length > 0,
    isTwoFactorEnabled,
    passkeyCount: user._count.passkeys,
    unusedBackupCodesCount: isTwoFactorEnabled
      ? await countUnusedBackupCodes(userId)
      : 0,
  }
}
