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

export const upsertUserTwoFactor = async (
  userId: string,
  config: TwoFactorConfig,
) => {
  try {
    await prisma.verification.upsert({
      create: {
        target: userId,
        type: TWO_FACTOR_VERIFICATION_TYPE,
        ...config,
      },
      update: { ...config },
      where: {
        target_type: {
          target: userId,
          type: TWO_FACTOR_VERIFICATION_TYPE,
        },
      },
    })
  } catch (error) {
    throwDbError(error, 'Unable to store the two-factor verification.')
  }
}

export const deleteUserTwoFactor = async (userId: string) => {
  try {
    // deleteMany so disabling is idempotent even if nothing is enrolled.
    await prisma.verification.deleteMany({
      where: {
        target: userId,
        type: TWO_FACTOR_VERIFICATION_TYPE,
      },
    })
  } catch (error) {
    throwDbError(error, 'Unable to delete the two-factor verification.')
  }
}
