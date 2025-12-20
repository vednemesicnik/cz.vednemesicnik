import bcrypt from 'bcryptjs'

import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

export const changePassword = async (userId: string, newPassword: string) => {
  try {
    await prisma.password.update({
      data: {
        hash: bcrypt.hashSync(newPassword, 10),
      },
      where: {
        userId,
      },
    })
  } catch (error) {
    throwDbError(error, 'Unable to update the password.')
  }
}
