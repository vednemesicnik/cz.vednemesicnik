import type { Prisma } from '@generated/prisma/client'

import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.PodcastOrderByWithRelationInput
> = {
  createdAt: (order) => ({ createdAt: order }),
  title: (order) => ({ title: order }),
}

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

  const { order, q, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys: SORT_KEYS,
  })

  const permissionWhere = {
    OR: buildViewableStateFilters(
      [
        { rights: draftPerms, state: 'draft' },
        { rights: publishedPerms, state: 'published' },
        { rights: archivedPerms, state: 'archived' },
      ],
      { authorId: context.authorId },
    ),
  }

  // SQLite `contains` is case-insensitive for ASCII only; Czech diacritics
  // match case-sensitively (accepted limitation).
  const where = {
    AND: [permissionWhere, ...(q === '' ? [] : [{ title: { contains: q } }])],
  }

  const rawPodcasts = await prisma.podcast.findMany({
    orderBy: ORDER_BY[sort](order),
    select: {
      authorId: true,
      createdAt: true,
      id: true,
      state: true,
      title: true,
    },
    where,
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
    q,
  }
}
