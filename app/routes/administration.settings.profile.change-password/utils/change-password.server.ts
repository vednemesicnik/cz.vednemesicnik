import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

import { prisma } from "~/utils/db.server"

export const changePassword = async (userId: string, newPassword: string) => {
  try {
    await prisma.password.update({
      where: {
        userId,
      },
      data: {
        hash: bcrypt.hashSync(newPassword, 10),
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to update the password. ${error.message}`,
        {
          status: 400,
        }
      )
    }

    throw error
  }
}
