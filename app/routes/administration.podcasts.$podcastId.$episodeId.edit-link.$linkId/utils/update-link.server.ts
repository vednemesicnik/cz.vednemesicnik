import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  linkId: string
  label: string
  url: string
}

export async function updateLink({ linkId, label, url }: Args) {
  try {
    await prisma.podcastEpisodeLink.update({
      where: { id: linkId },
      data: {
        label,
        url,
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to update the link. ${error.message}`,
        {
          status: 400,
        }
      )
    }

    throw error
  }
}
