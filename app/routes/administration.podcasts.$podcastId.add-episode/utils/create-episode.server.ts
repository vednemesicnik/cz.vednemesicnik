import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  title: string
  slug: string
  description: string
  published: boolean
  publishedAt: string
  podcastId: string
}

export async function createEpisode({
  title,
  slug,
  description,
  published,
  publishedAt,
  podcastId,
}: Args) {
  try {
    await prisma.podcastEpisode.create({
      data: {
        title,
        slug,
        description,
        published,
        publishedAt: new Date(publishedAt),
        podcast: {
          connect: { id: podcastId },
        },
        author: {
          connect: { username: "owner" },
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
