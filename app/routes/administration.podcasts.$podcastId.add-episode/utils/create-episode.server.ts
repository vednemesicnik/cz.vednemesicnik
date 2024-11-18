import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  number: number
  title: string
  slug: string
  description: string
  published: boolean
  publishedAt: string
  podcastId: string
  authorId: string
}

export async function createEpisode({
  number,
  title,
  slug,
  description,
  published,
  publishedAt,
  podcastId,
  authorId,
}: Args) {
  try {
    await prisma.podcastEpisode.create({
      data: {
        number,
        title,
        slug,
        description,
        published,
        publishedAt: new Date(publishedAt),
        podcast: {
          connect: { id: podcastId },
        },
        author: {
          connect: { id: authorId },
        },
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to create the episode. ${error.message}`,
        {
          status: 400,
        }
      )
    }

    throw error
  }
}
