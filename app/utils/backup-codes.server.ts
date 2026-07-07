import { createBackupCodeSet, matchBackupCodeHash } from '~/utils/backup-codes'
import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

// Replace the user's entire set with a fresh one, returning the plaintext codes
// for a single display. Invalidates all previous codes (used and unused).
export const regenerateBackupCodes = async (userId: string) => {
  const set = createBackupCodeSet()

  try {
    await prisma.$transaction([
      prisma.backupCode.deleteMany({ where: { userId } }),
      prisma.backupCode.createMany({
        data: set.map(({ hash }) => ({ codeHash: hash, userId })),
      }),
    ])
  } catch (error) {
    throwDbError(error, 'Unable to regenerate the backup codes.')
  }

  return set.map(({ code }) => code)
}

// Try to redeem an entered code against the user's unused codes. On a match the
// row is marked used and true is returned; single-use is enforced by usedAt.
export const redeemBackupCode = async (userId: string, input: string) => {
  try {
    const codes = await prisma.backupCode.findMany({
      select: { codeHash: true, id: true },
      where: { usedAt: null, userId },
    })

    const index = matchBackupCodeHash(
      input,
      codes.map(({ codeHash }) => codeHash),
    )

    if (index === -1) {
      return false
    }

    // Conditional update guards against a race: only the request that flips
    // usedAt from null wins, so a code can never be redeemed twice even under
    // concurrent sign-in attempts.
    const result = await prisma.backupCode.updateMany({
      data: { usedAt: new Date() },
      where: { id: codes[index].id, usedAt: null },
    })

    return result.count === 1
  } catch (error) {
    return throwDbError(error, 'Unable to redeem the backup code.')
  }
}

// Remaining unused codes — drives the low-codes warning / regenerate prompt.
export const countUnusedBackupCodes = async (userId: string) => {
  try {
    return await prisma.backupCode.count({ where: { usedAt: null, userId } })
  } catch (error) {
    return throwDbError(error, 'Unable to count the backup codes.')
  }
}
