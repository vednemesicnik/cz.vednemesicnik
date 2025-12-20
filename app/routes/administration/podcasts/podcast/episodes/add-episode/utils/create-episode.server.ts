import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type Args = {
  number: number
  title: string
  slug: string
  description: string
  podcastId: string
  authorId: string
}

export async function createEpisode({
  number,
  title,
  slug,
  description,
  podcastId,
  authorId,
}: Args) {
  try {
    const episode = await prisma.podcastEpisode.create({
      data: {
        author: {
          connect: { id: authorId },
        },
        description,
        number,
        podcast: {
          connect: { id: podcastId },
        },
        slug,
        title,
      },
    })

    return { episodeId: episode.id }
  } catch (error) {
    return throwDbError(error, 'Unable to create the episode.')
  }
}
