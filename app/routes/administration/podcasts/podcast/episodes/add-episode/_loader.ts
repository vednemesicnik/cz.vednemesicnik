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
    targetAuthorId: context.authorId,
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

  const [podcast, authors] = await Promise.all([podcastPromise, authorsPromise])

  return {
    authors,
    podcast,
    selfAuthorId: context.authorId,
  }
}
