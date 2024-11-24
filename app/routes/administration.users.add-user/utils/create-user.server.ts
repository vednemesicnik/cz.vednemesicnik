import bcrypt from "bcryptjs"

import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Args = {
  email: string
  name: string
  password: string
  roleId: string
}

export const createUser = async ({ email, name, password, roleId }: Args) => {
  try {
    await prisma.$transaction(async (prisma) => {
      const author = await prisma.author.create({
        data: {
          name,
          role: {
            connect: {
              name: "author",
            },
          },
        },
      })

      await prisma.user.create({
        data: {
          email,
          username: email,
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
          author: {
            connect: {
              id: author.id,
            },
          },
        },
      })
    })
  } catch (error) {
    throwDbError(error, "Unable to create the user.")
  }
}
