import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

export const deleteUser = async (id: string) => {
  if (process.env.PERMANENT_USER_ID === id) {
    throw new Response("Error: Unable to delete the user.", {
      status: 400,
    })
  }

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
