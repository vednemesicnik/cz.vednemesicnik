import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

import { prisma } from "~/utils/db.server"

type Args = {
  email: string
  username: string
  name: string
  password: string
  roleId: string
}

export const createUser = async ({
  email,
  username,
  name,
  password,
  roleId,
}: Args) => {
  try {
    await prisma.user.create({
      data: {
        email,
        username,
        name,
        password: {
          create: {
            hash: bcrypt.hashSync(password, 10),
          },
        },
        role: {
          connect: {
            id: roleId,
          },
        },
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to add user. ${error.message}`,
        { status: 400 }
      )
    }

    throw error
  }
}
