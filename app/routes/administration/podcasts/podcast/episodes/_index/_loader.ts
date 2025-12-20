import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['podcast_episode'],
  })

  const { podcastId } = params

  // Check view permissions for each state
  const draftPerms = context.can({
    action: 'view',
    entity: 'podcast_episode',
    state: 'draft',
  })
  const publishedPerms = context.can({
    action: 'view',
    entity: 'podcast_episode',
    state: 'published',
  })
  const archivedPerms = context.can({
    action: 'view',
    entity: 'podcast_episode',
    state: 'archived',
  })

  const podcast = await prisma.podcast.findUniqueOrThrow({
    select: {
      episodes: {
        orderBy: { publishedAt: 'desc' },
        select: {
          authorId: true,
          id: true,
          publishedAt: true,
          state: true,
          title: true,
        },
        where: {
          OR: [
            {
              state: 'draft',
              ...(draftPerms.hasOwn && !draftPerms.hasAny
                ? { authorId: context.authorId }
                : {}),
            },
            {
              state: 'published',
              ...(publishedPerms.hasOwn && !publishedPerms.hasAny
                ? { authorId: context.authorId }
                : {}),
            },
            {
              state: 'archived',
              ...(archivedPerms.hasOwn && !archivedPerms.hasAny
                ? { authorId: context.authorId }
                : {}),
            },
          ],
        },
      },
      id: true,
      title: true,
    },
    where: { id: podcastId },
  })

  // Compute permissions for each episode
  const episodes = podcast.episodes.map((episode) => {
    return {
      ...episode,
      canDelete: context.can({
        action: 'delete',
        entity: 'podcast_episode',
        state: episode.state,
        targetAuthorId: episode.authorId,
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'podcast_episode',
        state: episode.state,
        targetAuthorId: episode.authorId,
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'podcast_episode',
        state: episode.state,
        targetAuthorId: episode.authorId,
      }).hasPermission,
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'podcast_episode',
      state: 'draft',
      targetAuthorId: context.authorId,
    }).hasPermission,
    podcast: {
      ...podcast,
      episodes,
    },
  }
}
