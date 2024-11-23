import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Args = {
  podcastId: string
  episodeId: string
  number: number
  title: string
  slug: string
  published: boolean
  publishedAt: string
  description: string
  authorId: string
}

export async function updateEpisode({
  episodeId,
  number,
  title,
  slug,
  published,
  publishedAt,
  description,
  authorId,
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
        author: {
          connect: { id: authorId },
        },
      },
    })
  } catch (error) {
    throwDbError(error, "Unable to update the episode.")
  }
}
