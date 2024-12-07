import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

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
        state: published ? "published" : "draft",
        publishedAt: new Date(publishedAt),
        podcast: {
          connect: { id: podcastId },
        },
        author: {
          connect: { id: authorId },
        },
      },
    })

    return { ok: true }
  } catch (error) {
    throwDbError(error, "Unable to create the episode.")
  }
}
