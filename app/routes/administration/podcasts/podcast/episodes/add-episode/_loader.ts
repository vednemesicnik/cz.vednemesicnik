import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['podcast_episode'],
  })

  checkAuthorPermission(context, {
    action: 'create',
    entity: 'podcast_episode',
    state: 'draft',
    targetAuthorIds: [context.authorId],
  })

  const { podcastId } = params

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    select: {
      id: true,
    },
    where: { id: podcastId },
  })

  const authorsPromise = prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  // The highest number + 1, an archived episode's included (27d); only a
  // published number is unique in the podcast (log 0039).
  const highestNumberPromise = prisma.podcastEpisode.aggregate({
    _max: { number: true },
    where: { podcastId },
  })

  const [podcast, authors, highestNumber] = await Promise.all([
    podcastPromise,
    authorsPromise,
    highestNumberPromise,
  ])

  return {
    authors,
    nextNumber: (highestNumber._max.number ?? 0) + 1,
    podcast,
    selfAuthorId: context.authorId,
  }
}
