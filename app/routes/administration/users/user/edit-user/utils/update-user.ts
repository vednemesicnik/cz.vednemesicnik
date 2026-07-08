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

  // Hash outside the transaction: bcrypt is CPU-bound and would otherwise
  // hold the SQLite transaction open, increasing lock contention.
  const passwordHash =
    password !== undefined ? bcrypt.hashSync(password, 12) : undefined

  try {
    await prisma.$transaction(async (prisma) => {
      const updatedUser = await prisma.user.update({
        data: {
          email,
          name,
          username: email,
          ...(passwordHash !== undefined
            ? {
                password: {
                  update: {
                    hash: passwordHash,
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
