import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  podcastId: string
  episodeId: string
  number: number
  title: string
  slug: string
  published: boolean
  publishedAt: string
  description: string
}

export async function updateEpisode({
  episodeId,
  number,
  title,
  slug,
  published,
  publishedAt,
  description,
}: Args) {
  try {
    await prisma.podcastEpisode.update({
      where: { id: episodeId },
      data: {
        number,
        title,
        slug,
        description,
        published,
        publishedAt: new Date(publishedAt),
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to update the episode. ${error.message}`,
        {
          status: 400,
        }
      )
    }

    throw error
  }
}