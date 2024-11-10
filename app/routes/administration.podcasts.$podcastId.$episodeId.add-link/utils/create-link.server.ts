import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  label: string
  url: string
  episodeId: string
}

export async function createLink({ label, url, episodeId }: Args) {
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
          connect: { username: "owner" },
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
