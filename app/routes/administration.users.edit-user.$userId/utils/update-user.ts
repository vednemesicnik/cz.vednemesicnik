import bcrypt from "bcryptjs"

import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Data = {
  email: string
  username: string
  name: string
  password?: string
  roleId: string
  userId: string
}

export const updateUser = async (data: Data, sessionId: string) => {
  const { email, username, name, password, roleId, userId } = data

  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      user: {
        select: {
          id: true,
          role: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  })

  if (
    (process.env.PERMANENT_USER_ID === userId && userId !== session.user.id) ||
    session.user.role.id !== roleId
  ) {
    throw new Response("Error: Unable to update the user.", {
      status: 400,
    })
  }

  try {
    await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          email,
          username,
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
        where: { id: user.authorId },
        data: {
          name,
        },
      })
    })
  } catch (error) {
    throwDbError(error, "Unable to update the user.")
  }
}
