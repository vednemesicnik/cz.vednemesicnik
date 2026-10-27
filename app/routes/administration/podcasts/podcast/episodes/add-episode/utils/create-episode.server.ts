import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { prisma } from '~/utils/db.server'
import {
  type PublishingAuthor,
  publishContentEvent,
} from '~/utils/sse/publish-content-event.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type Args = {
  number: number
  title: string
  slug: string
  description: string
  podcastId: string
  authorId: string
  links?: { label: string; url: string }[]
  actor: PublishingAuthor
}

export async function createEpisode({
  number,
  title,
  slug,
  description,
  podcastId,
  authorId,
  links = [],
  actor,
}: Args) {
  try {
    const episode = await prisma.podcastEpisode.create({
      data: {
        author: {
          connect: { id: authorId },
        },
        description,
        // Created with content, so no empty draft (log 0020).
        firstContentAt: new Date(),
        links: {
          create: links.map((link, index) => ({
            label: link.label,
            order: index,
            url: link.url,
          })),
        },
        number,
        podcast: {
          connect: { id: podcastId },
        },
        slug,
        title,
      },
    })

    await recordContentLog(
      { entity: 'podcast_episode', entityId: episode.id, events: ['create'] },
      actor,
    )
    publishContentEvent(
      { change: 'create', entity: 'podcast_episode', entityId: episode.id },
      actor,
    )

    return { episodeId: episode.id }
  } catch (error) {
    return throwDbError(error, 'Unable to create the episode.')
  }
}
