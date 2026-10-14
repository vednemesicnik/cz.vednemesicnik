import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { prisma } from '~/utils/db.server'
import {
  type PublishingAuthor,
  publishContentEvent,
} from '~/utils/sse/publish-content-event.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type Args = {
  id: string
  number: number
  title: string
  slug: string
  description: string
  authorId: string
  links?: { label: string; url: string }[]
  actor: PublishingAuthor
}

export async function updateEpisode({
  id,
  number,
  title,
  slug,
  description,
  authorId,
  links = [],
  actor,
}: Args) {
  try {
    // Links inherit the episode's lifecycle, so replace the whole set on save.
    // Delete then recreate in an explicit transaction rather than a nested
    // deleteMany + create, whose execution order Prisma does not guarantee.
    await prisma.$transaction(async (transaction) => {
      await transaction.podcastEpisodeLink.deleteMany({
        where: { episodeId: id },
      })

      await transaction.podcastEpisode.update({
        data: {
          authorId,
          description,
          links: {
            create: links.map((link, index) => ({
              label: link.label,
              order: index,
              url: link.url,
            })),
          },
          number,
          slug,
          title,
        },
        where: { id },
      })
    })

    // The links are saved with the episode, so its update covers them.
    await recordContentLog(
      { entity: 'podcast_episode', entityId: id, events: ['update'] },
      actor,
    )
    publishContentEvent(
      { change: 'update', entity: 'podcast_episode', entityId: id },
      actor,
    )
  } catch (error) {
    throwDbError(error, 'Unable to update the episode.')
  }
}
