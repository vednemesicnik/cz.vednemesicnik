import { prisma } from '~/utils/db.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['podcast'],
  })

  // Check view permissions for each state
  const draftPerms = context.can({
    action: 'view',
    entity: 'podcast',
    state: 'draft',
  })
  const publishedPerms = context.can({
    action: 'view',
    entity: 'podcast',
    state: 'published',
  })
  const archivedPerms = context.can({
    action: 'view',
    entity: 'podcast',
    state: 'archived',
  })

  const rawPodcasts = await prisma.podcast.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      authorId: true,
      id: true,
      state: true,
      title: true,
    },
    where: {
      OR: buildViewableStateFilters(
        [
          { state: 'draft', rights: draftPerms },
          { state: 'published', rights: publishedPerms },
          { state: 'archived', rights: archivedPerms },
        ],
        { authorId: context.authorId },
      ),
    },
  })

  // Compute permissions for each podcast
  const podcasts = rawPodcasts.map((podcast) => {
    return {
      ...podcast,
      canDelete: context.can({
        action: 'delete',
        entity: 'podcast',
        state: podcast.state,
        targetAuthorIds: [podcast.authorId],
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'podcast',
        state: podcast.state,
        targetAuthorIds: [podcast.authorId],
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'podcast',
        state: podcast.state,
        targetAuthorIds: [podcast.authorId],
      }).hasPermission,
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'podcast',
      state: 'draft',
      targetAuthorIds: [context.authorId],
    }).hasPermission,
    podcasts,
  }
}
