import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

export async function deleteLink(id: string) {
  try {
    await prisma.podcastEpisodeLink.delete({
      where: { id },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to delete link. ${error.message}`,
        { status: 400 }
      )
    }

    throw error
  }
}
