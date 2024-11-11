import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

export const deleteUser = async (id: string) => {
  try {
    await prisma.user.delete({
      where: { id },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to delete the user. ${error.message}`,
        {
          status: 400,
        }
      )
    }

    throw error
  }
}
