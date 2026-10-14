import type { Prisma } from '@generated/prisma/client'
import { data } from 'react-router'

import { adminUsersSectionDeniedData } from '~/components/boundary-error/utils/boundary-copy'
import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { canEditUser } from '~/utils/permissions/user/guards/can-edit-user'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

// Non-createdAt sorts append `createdAt desc` as a tie-breaker so rows with
// equal values keep a deterministic order across reloads.
const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.UserOrderByWithRelationInput[]
> = {
  createdAt: (order) => [{ createdAt: order }],
  email: (order) => [{ email: order }, { createdAt: 'desc' }],
  // The name belongs to the author (design 28f).
  name: (order) => [{ author: { name: order } }, { createdAt: 'desc' }],
  role: (order) => [{ role: { level: order } }, { createdAt: 'desc' }],
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getUserPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['user'],
  })

  // Check view permission - check if user can view at least themselves
  const viewPerms = context.can({
    action: 'view',
    entity: 'user',
    targetUserId: context.userId,
  })

  // If user has no view permissions at all (neither own nor any), they shouldn't access this page
  if (!viewPerms.hasOwn && !viewPerms.hasAny) {
    throw data(adminUsersSectionDeniedData, { status: 403 })
  }

  const { order, query, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys: SORT_KEYS,
  })

  const permissionWhere =
    viewPerms.hasOwn && !viewPerms.hasAny ? { id: context.userId } : {}

  // SQLite `contains` is case-insensitive for ASCII only; Czech diacritics
  // match case-sensitively (accepted limitation).
  const searchWhere =
    query === ''
      ? []
      : [
          {
            OR: [
              { email: { contains: query } },
              { author: { name: { contains: query } } },
            ],
          },
        ]

  // The list has only the search (28d), ANDed with the permission clause, so a
  // member still gets their own account at most.
  const where = { AND: [permissionWhere, ...searchWhere] }

  // Fetch users based on permissions
  const rawUsers = await prisma.user.findMany({
    orderBy: ORDER_BY[sort](order),
    select: {
      author: { select: { name: true } },
      createdAt: true,
      email: true,
      id: true,
      role: {
        select: {
          id: true,
          level: true,
          name: true,
        },
      },
    },
    where,
  })

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
      canUpdate: canEditUser(context, {
        targetUserId: user.id,
        targetUserRoleLevel: user.role.level,
      }),
      canView: context.can({
        action: 'view',
        entity: 'user',
        targetUserId: user.id,
        targetUserRoleLevel: user.role.level,
      }).hasPermission,
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'user',
      targetUserId: context.userId,
    }).hasPermission,
    query,
    users,
  }
}
