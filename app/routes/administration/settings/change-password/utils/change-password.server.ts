import bcrypt from 'bcryptjs'

import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

/**
 * Sets the user's password, creating it when the account has none yet
 * (an invited account signs in without one).
 *
 * @param userId - The signed-in user.
 * @param newPassword - The new password in plain text.
 */
export const changePassword = async (userId: string, newPassword: string) => {
  const hash = bcrypt.hashSync(newPassword, 12)

  try {
    await prisma.password.upsert({
      create: { hash, userId },
      update: { hash },
      where: { userId },
    })
  } catch (error) {
    throwDbError(error, 'Unable to update the password.')
  }
}
