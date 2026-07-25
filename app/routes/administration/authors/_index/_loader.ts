import type { Prisma } from '@generated/prisma/client'

import {
  extractAdminListFilterSearch,
  FILTER_PRESET_PARAM,
  parseAdminListFilters,
} from '~/utils/admin-list-filters'
import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
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

  const [rawAuthors, ownFilters, rawSharedFilters] = await Promise.all([
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
    prisma.filter.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        isDefault: true,
        isShared: true,
        name: true,
        query: true,
      },
      where: { tableKey: TABLE_KEY, userId: context.userId },
    }),
    // Someone else's shared presets: apply-only, and labelled with their owner —
    // the unique index is per user, so two people can publish the same name.
    prisma.filter.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        query: true,
        user: { select: { name: true, username: true } },
      },
      where: {
        isShared: true,
        NOT: { userId: context.userId },
        tableKey: TABLE_KEY,
      },
    }),
  ])

  // `User.name` is optional; the username is unique and always set, so it keeps the
  // owner label unambiguous when two people share a preset of the same name.
  const sharedFilters = rawSharedFilters.map((filter) => ({
    id: filter.id,
    name: filter.name,
    ownerName: filter.user.name ?? filter.user.username,
    query: filter.query,
  }))

  // A preset the viewer cannot see (deleted, unshared, or someone else's private one)
  // leaves the menu unhighlighted instead of pointing at nothing.
  const requestedFilterId = url.searchParams.get(FILTER_PRESET_PARAM)
  const activeFilterId =
    requestedFilterId !== null &&
    [...ownFilters, ...sharedFilters].some(
      (filter) => filter.id === requestedFilterId,
    )
      ? requestedFilterId
      : null

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
    activeFilterId,
    authors,
    canCreate: createPerms.hasAny, // Only "any" access can create new authors
    // Canonical snapshot of what the selects currently hold — what a save or an
    // overwrite stores, and what tells the menu there is anything worth saving.
    currentFilterQuery: extractAdminListFilterSearch(url.search, TABLE_KEY),
    filters,
    ownFilters,
    query,
    sharedFilters,
  }
}
