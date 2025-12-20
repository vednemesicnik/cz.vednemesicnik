import { prisma } from '~/utils/db.server'
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
  })

  // Compute permissions for each podcast
  const podcasts = rawPodcasts.map((podcast) => {
    return {
      ...podcast,
      canDelete: context.can({
        action: 'delete',
        entity: 'podcast',
        state: podcast.state,
        targetAuthorId: podcast.authorId,
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'podcast',
        state: podcast.state,
        targetAuthorId: podcast.authorId,
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'podcast',
        state: podcast.state,
        targetAuthorId: podcast.authorId,
      }).hasPermission,
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'podcast',
      state: 'draft',
      targetAuthorId: context.authorId,
    }).hasPermission,
    podcasts,
  }
}
