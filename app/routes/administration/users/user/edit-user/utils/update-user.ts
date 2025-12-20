import type { UserRoleName } from '@generated/prisma/enums'
import bcrypt from 'bcryptjs'
import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'
import { throwError } from '~/utils/throw-error.server'

type Data = {
  email: string
  name: string
  password?: string
  roleId: string
  userId: string
}

export const updateUser = async ({
  email,
  name,
  password,
  roleId,
  userId,
}: Data) => {
  const userToUpdate = await prisma.user.findUnique({
    select: {
      role: {
        select: {
          name: true,
        },
      },
    },
    where: { id: userId },
  })

  const owner: UserRoleName = 'owner'

  // Owner cannot be updated
  if (userToUpdate === null || userToUpdate.role.name === owner) {
    throwError('Unable to update the user.')
  }

  try {
    await prisma.$transaction(async (prisma) => {
      const updatedUser = await prisma.user.update({
        data: {
          email,
          name,
          username: email,
          ...(password !== undefined
            ? {
                password: {
                  update: {
                    hash: bcrypt.hashSync(password, 10),
                  },
                },
              }
            : {}),
          role: {
            connect: {
              id: roleId,
            },
          },
        },
        where: { id: userId },
      })

      await prisma.author.update({
        data: {
          name,
        },
        where: { id: updatedUser.authorId },
      })
    })
  } catch (error) {
    throwDbError(error, 'Unable to update the user.')
  }
}
