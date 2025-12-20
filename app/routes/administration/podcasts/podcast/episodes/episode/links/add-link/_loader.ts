import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['podcast_episode_link'],
  })

  const { podcastId, episodeId } = params

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    select: { id: true },
    where: { id: podcastId },
  })

  const episodePromise = prisma.podcastEpisode.findUniqueOrThrow({
    select: {
      id: true,
    },
    where: { id: episodeId },
  })

  const authorsPromise = prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const [podcast, episode, authors] = await Promise.all([
    podcastPromise,
    episodePromise,
    authorsPromise,
  ])

  // Check if user can create draft links
  checkAuthorPermission(context, {
    action: 'create',
    entity: 'podcast_episode_link',
    state: 'draft',
    targetAuthorId: context.authorId,
  })

  return {
    authors,
    episode,
    podcast,
    selfAuthorId: context.authorId,
  }
}
