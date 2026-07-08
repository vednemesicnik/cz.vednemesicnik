import { buildBackupCodeReplacement } from '~/utils/backup-codes.server'
import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

// The break-glass second factor reuses the shared Verification model with a
// dedicated type; target is the user id (see prisma/schema.prisma).
export const TWO_FACTOR_VERIFICATION_TYPE = '2fa'

// TOTP parameters that map 1:1 onto the Verification model columns.
export type TwoFactorConfig = {
  secret: string
  algorithm: string
  digits: number
  period: number
  charSet: string
}

export const getUserTwoFactor = async (userId: string) => {
  try {
    return await prisma.verification.findUnique({
      select: {
        algorithm: true,
        charSet: true,
        digits: true,
        id: true,
        period: true,
        secret: true,
      },
      where: {
        target_type: {
          target: userId,
          type: TWO_FACTOR_VERIFICATION_TYPE,
        },
      },
    })
  } catch (error) {
    return throwDbError(error, 'Unable to load the two-factor verification.')
  }
}

// Enable 2FA and issue the initial backup codes in one transaction, so a user
// can never end up enrolled without codes (or vice versa) on a transient
// failure. Returns the plaintext codes for a single display.
export const enableUserTwoFactor = async (
  userId: string,
  config: TwoFactorConfig,
) => {
  const { codes, operations } = buildBackupCodeReplacement(userId)

  try {
    await prisma.$transaction([
      prisma.verification.upsert({
        create: {
          target: userId,
          type: TWO_FACTOR_VERIFICATION_TYPE,
          ...config,
        },
        update: { ...config },
        where: {
          target_type: { target: userId, type: TWO_FACTOR_VERIFICATION_TYPE },
        },
      }),
      ...operations,
    ])
  } catch (error) {
    throwDbError(error, 'Unable to enable the two-factor verification.')
  }

  return codes
}

// Disabling 2FA drops both the enrollment and its backup codes in one
// transaction, so the two can't fall out of sync on a transient failure.
// deleteMany keeps it idempotent even if nothing is enrolled.
export const disableUserTwoFactor = async (userId: string) => {
  try {
    await prisma.$transaction([
      prisma.verification.deleteMany({
        where: { target: userId, type: TWO_FACTOR_VERIFICATION_TYPE },
      }),
      prisma.backupCode.deleteMany({ where: { userId } }),
    ])
  } catch (error) {
    throwDbError(error, 'Unable to disable the two-factor verification.')
  }
}
