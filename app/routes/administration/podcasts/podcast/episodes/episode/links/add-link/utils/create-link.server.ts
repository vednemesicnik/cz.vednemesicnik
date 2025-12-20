import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type Args = {
  label: string
  url: string
  episodeId: string
  authorId: string
}

export async function createLink({ label, url, episodeId, authorId }: Args) {
  try {
    const link = await prisma.podcastEpisodeLink.create({
      data: {
        author: {
          connect: { id: authorId },
        },
        episode: {
          connect: { id: episodeId },
        },
        label,
        publishedAt: new Date(),
        state: 'published',
        url,
      },
      select: {
        id: true,
      },
    })

    return { linkId: link.id }
  } catch (error) {
    return throwDbError(error, 'Unable to create the link.')
  }
}
