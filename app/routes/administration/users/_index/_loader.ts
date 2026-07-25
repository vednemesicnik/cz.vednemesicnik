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

const TABLE_KEY = 'users'

// Non-createdAt sorts append `createdAt desc` as a tie-breaker so rows with
// equal values keep a deterministic order across reloads.
const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.UserOrderByWithRelationInput[]
> = {
  createdAt: (order) => [{ createdAt: order }],
  email: (order) => [{ email: order }, { createdAt: 'desc' }],
  name: (order) => [{ name: order }, { createdAt: 'desc' }],
  role: (order) => [{ role: { level: order } }, { createdAt: 'desc' }],
}

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await getUserPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['user'],
  })

  // Before any query: a bare visit with a default preset never renders this list,
  // it redirects to the preset's own URL.
  await resolveDefaultFilter({
    tableKey: TABLE_KEY,
    url,
    userId: context.userId,
  })

  // Check view permission - check if user can view at least themselves
  const viewPerms = context.can({
    action: 'view',
    entity: 'user',
    targetUserId: context.userId,
  })

  // If user has no view permissions at all (neither own nor any), they shouldn't access this page
  if (!viewPerms.hasOwn && !viewPerms.hasAny) {
    throw new Response('Forbidden', { status: 403 })
  }

  const { order, query, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys: SORT_KEYS,
  })

  const filters = parseAdminListFilters(request, TABLE_KEY)

  const permissionWhere =
    viewPerms.hasOwn && !viewPerms.hasAny ? { id: context.userId } : {}

  // SQLite `contains` is case-insensitive for ASCII only; Czech diacritics
  // match case-sensitively (accepted limitation).
  const searchWhere =
    query === ''
      ? []
      : [
          {
            OR: [{ email: { contains: query } }, { name: { contains: query } }],
          },
        ]

  // The role filter is ANDed with the permission clause, so it only ever narrows
  // what the viewer may see — a member still gets their own account at most.
  const where = {
    AND: [
      permissionWhere,
      ...searchWhere,
      ...(filters.role === undefined ? [] : [{ role: { name: filters.role } }]),
    ],
  }

  // Fetch users based on permissions
  const [rawUsers, ownFilters, rawSharedFilters] = await Promise.all([
    prisma.user.findMany({
      orderBy: ORDER_BY[sort](order),
      select: {
        createdAt: true,
        email: true,
        id: true,
        name: true,
        role: {
          select: {
            id: true,
            level: true,
            name: true,
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

  // Compute permissions for each user
  const users = rawUsers.map((user) => {
    return {
      ...user,
      canDelete: context.can({
        action: 'delete',
        entity: 'user',
        targetUserId: user.id,
        targetUserRoleLevel: user.role.level,
      }).hasPermission,
      canUpdate: context.can({
        action: 'update',
        entity: 'user',
        targetUserId: user.id,
        targetUserRoleLevel: user.role.level,
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'user',
        targetUserId: user.id,
        targetUserRoleLevel: user.role.level,
      }).hasPermission,
    }
  })

  return {
    activeFilterId,
    canCreate: context.can({
      action: 'create',
      entity: 'user',
      targetUserId: context.userId,
    }).hasPermission,
    // Canonical snapshot of what the selects currently hold — what a save or an
    // overwrite stores, and what tells the menu there is anything worth saving.
    currentFilterQuery: extractAdminListFilterSearch(url.search, TABLE_KEY),
    filters,
    ownFilters,
    query,
    sharedFilters,
    users,
  }
}
