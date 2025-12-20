import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
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
      links: {
        select: {
          authorId: true,
          id: true,
          label: true,
          state: true,
          url: true,
        },
      },
      state: true,
      title: true,
    },
    where: { id: episodeId },
  })

  const [podcast, episode] = await Promise.all([podcastPromise, episodePromise])

  // Compute permissions for each link
  const links = episode.links.map((link) => {
    return {
      ...link,
      canDelete: context.can({
        action: 'delete',
        entity: 'podcast_episode_link',
        state: link.state,
        targetAuthorId: link.authorId,
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'podcast_episode_link',
        state: link.state,
        targetAuthorId: link.authorId,
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'podcast_episode_link',
        state: link.state,
        targetAuthorId: link.authorId,
      }).hasPermission,
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'podcast_episode_link',
      state: 'draft',
      targetAuthorId: context.authorId,
    }).hasPermission,
    episode: {
      ...episode,
      links,
    },
    podcast,
  }
}
