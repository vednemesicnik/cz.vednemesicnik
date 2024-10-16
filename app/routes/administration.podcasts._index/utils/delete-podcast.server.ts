import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

export const deletePodcast = async (id: string) => {
  try {
    await prisma.podcast.delete({
      where: { id },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to delete the podcast. ${error.message}`,
        {
          status: 400,
        }
      )
    }

    throw error
  }
}
