import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'
import { throwError } from '~/utils/throw-error.server'

type Data = {
  email: string
  roleId: string
  userId: string
}

export const updateUser = async ({ email, roleId, userId }: Data) => {
  const userToUpdate = await prisma.user.findUnique({
    select: { id: true },
    where: { id: userId },
  })

  // Role changes (including the single-owner policy) are enforced in the action,
  // where both the current and the target role are available. Here we only
  // guard against updating a non-existent user.
  if (userToUpdate === null) {
    throwError('Unable to update the user.')
  }

  try {
    await prisma.user.update({
      data: {
        email,
        role: {
          connect: {
            id: roleId,
          },
        },
        username: email,
      },
      where: { id: userId },
    })
  } catch (error) {
    throwDbError(error, 'Unable to update the user.')
  }
}
