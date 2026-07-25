import type { Prisma } from '@generated/prisma/client'

import { parseAdminListFilters } from '~/utils/admin-list-filters'
import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { loadSavedFilters } from '~/utils/load-saved-filters.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

const TABLE_KEY = 'podcasts'

// Non-createdAt sorts append `createdAt desc` as a tie-breaker so rows with
// equal values keep a deterministic order across reloads.
const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.PodcastOrderByWithRelationInput[]
> = {
  createdAt: (order) => [{ createdAt: order }],
  title: (order) => [{ title: order }, { createdAt: 'desc' }],
}

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['podcast'],
  })

  // Before any query: a bare visit with a default preset never renders this list,
  // it redirects to the preset's own URL.
  await resolveDefaultFilter({
    tableKey: TABLE_KEY,
    url,
    userId: context.userId,
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

  const { order, query, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys: SORT_KEYS,
  })

  const filters = parseAdminListFilters(request, TABLE_KEY)

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
  // match case-sensitively (accepted limitation). The field filter is ANDed with
  // the permission clause, so it only ever narrows what the role may view.
  const where = {
    AND: [
      permissionWhere,
      ...(query === '' ? [] : [{ title: { contains: query } }]),
      ...(filters.state === undefined ? [] : [{ state: filters.state }]),
    ],
  }

  const [rawPodcasts, savedFilters] = await Promise.all([
    prisma.podcast.findMany({
      orderBy: ORDER_BY[sort](order),
      select: {
        authorId: true,
        createdAt: true,
        id: true,
        state: true,
        title: true,
      },
      where,
    }),
    loadSavedFilters({ tableKey: TABLE_KEY, url, userId: context.userId }),
  ])

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
    ...savedFilters,
    canCreate: context.can({
      action: 'create',
      entity: 'podcast',
      state: 'draft',
      targetAuthorIds: [context.authorId],
    }).hasPermission,
    filters,
    podcasts,
    query,
  }
}
