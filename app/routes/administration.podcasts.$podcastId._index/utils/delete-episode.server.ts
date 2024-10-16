import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

export async function deleteEpisode(id: string) {
  try {
    await prisma.podcastEpisode.delete({
      where: { id: id },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to delete the episode. ${error.message}`,
        {
          status: 400,
        }
      )
    }
  }
}
