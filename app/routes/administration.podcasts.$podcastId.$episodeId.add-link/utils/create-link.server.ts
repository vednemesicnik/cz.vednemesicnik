import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  label: string
  url: string
  episodeId: string
  authorId: string
}

export async function createLink({ label, url, episodeId, authorId }: Args) {
  try {
    await prisma.podcastEpisodeLink.create({
      data: {
        label,
        url,
        episode: {
          connect: { id: episodeId },
        },
        publishedAt: new Date(),
        published: true,
        author: {
          connect: { id: authorId },
        },
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to create link. ${error.message}`,
        { status: 400 }
      )
    }

    throw error
  }
}
