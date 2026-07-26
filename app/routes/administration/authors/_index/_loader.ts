import type { Prisma } from '@generated/prisma/client'

import { parseAdminListFilters } from '~/utils/admin-list-filters'
import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { loadSavedFilters } from '~/utils/load-saved-filters.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

const TABLE_KEY = 'authors'

// Non-createdAt sorts append `createdAt desc` as a tie-breaker so rows with
// equal values keep a deterministic order across reloads.
const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.AuthorOrderByWithRelationInput[]
> = {
  createdAt: (order) => [{ createdAt: order }],
  email: (order) => [{ user: { email: order } }, { createdAt: 'desc' }],
  name: (order) => [{ name: order }, { createdAt: 'desc' }],
  role: (order) => [{ role: { level: order } }, { createdAt: 'desc' }],
}

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await getUserPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['author'],
  })

  // Before any query: a bare visit with a default preset never renders this list,
  // it redirects to the preset's own URL.
  await resolveDefaultFilter({
    tableKey: TABLE_KEY,
    url,
    userId: context.userId,
  })

  // Check if user has any view permission for authors
  // We check against own userId to see if they have at least "own" access
  const viewPerms = context.can({
    action: 'view',
    entity: 'author',
    targetUserId: context.userId,
  })

  // If user has no view permissions at all, they shouldn't access this page
  if (!viewPerms.hasPermission) {
    throw new Response('Forbidden', { status: 403 })
  }

  const { order, query, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys: SORT_KEYS,
  })

  const filters = parseAdminListFilters(request, TABLE_KEY)

  // If user only has "own" permission, filter to only their author profile.
  const permissionWhere =
    viewPerms.hasOwn && !viewPerms.hasAny
      ? { user: { id: context.userId } }
      : {}

  // SQLite `contains` is case-insensitive for ASCII only; Czech diacritics
  // match case-sensitively (accepted limitation). The role filter is ANDed with
  // the permission clause, so it only ever narrows what the viewer may see.
  const where = {
    AND: [
      permissionWhere,
      ...(query === '' ? [] : [{ name: { contains: query } }]),
      ...(filters.role === undefined ? [] : [{ role: { name: filters.role } }]),
    ],
  }

  const [rawAuthors, savedFilters] = await Promise.all([
    prisma.author.findMany({
      orderBy: ORDER_BY[sort](order),
      select: {
        bio: true,
        createdAt: true,
        id: true,
        name: true,
        role: {
          select: {
            id: true,
            level: true,
            name: true,
          },
        },
        user: {
          select: {
            email: true,
            id: true,
          },
        },
      },
      where,
    }),
    loadSavedFilters({ tableKey: TABLE_KEY, url, userId: context.userId }),
  ])

  // Compute permissions for each author
  // targetUserId is the user who owns this author profile (or undefined for external authors)
  const authors = rawAuthors.map((author) => {
    const targetUserId = author.user?.id

    return {
      ...author,
      // Can only delete authors without linked User (onDelete: Restrict in schema)
      canDelete:
        context.can({
          action: 'delete',
          entity: 'author',
          targetUserId,
        }).hasPermission && !author.user,
      canUpdate: context.can({
        action: 'update',
        entity: 'author',
        targetUserId,
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'author',
        targetUserId,
      }).hasPermission,
    }
  })

  // Create doesn't need targetUserId - it's creating a new author
  const createPerms = context.can({
    action: 'create',
    entity: 'author',
  })

  return {
    ...savedFilters,
    authors,
    canCreate: createPerms.hasAny, // Only "any" access can create new authors
    filters,
    query,
  }
}
