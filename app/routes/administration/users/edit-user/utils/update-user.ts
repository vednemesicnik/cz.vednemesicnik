import bcrypt from "bcryptjs"

import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"
import { throwError } from "~/utils/throw-error.server"
import { type UserRoleName } from "~~/types/role"

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
    where: { id: userId },
    select: {
      role: {
        select: {
          name: true,
        },
      },
    },
  })

  const owner: UserRoleName = "owner"

  // Owner cannot be updated
  if (userToUpdate === null || userToUpdate.role.name === owner) {
    throwError("Unable to update the user.")
  }

  try {
    await prisma.$transaction(async (prisma) => {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          email,
          username: email,
          name,
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
      })

      await prisma.author.update({
        where: { id: updatedUser.authorId },
        data: {
          name,
        },
      })
    })

    return { ok: true }
  } catch (error) {
    throwDbError(error, "Unable to update the user.")
  }
}
