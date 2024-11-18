import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

import { prisma } from "~/utils/db.server"

type Args = {
  email: string
  username: string
  name: string
  password?: string
  roleId: string
  userId: string
}

export const updateUser = async ({
  email,
  username,
  name,
  password,
  roleId,
  userId,
}: Args) => {
  try {
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to update user. ${error.message}`,
        { status: 400 }
      )
    }

    throw error
  }
}
