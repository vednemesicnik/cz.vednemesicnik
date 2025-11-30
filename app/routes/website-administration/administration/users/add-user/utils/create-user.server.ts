import bcrypt from "bcryptjs"

import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Data = {
  email: string
  name: string
  password: string
  roleId: string
}

export const createUser = async ({ email, name, password, roleId }: Data) => {
  try {
    await prisma.$transaction(async (prisma) => {
      const author = await prisma.author.create({
        data: {
          name,
          role: {
            connect: {
              name: "contributor",
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

    return { ok: true }
  } catch (error) {
    throwDbError(error, "Unable to create the user.")
  }
}
