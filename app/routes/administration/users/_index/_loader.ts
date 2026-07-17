import type { Prisma } from '@generated/prisma/client'

import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.UserOrderByWithRelationInput
> = {
  createdAt: (order) => ({ createdAt: order }),
  email: (order) => ({ email: order }),
  name: (order) => ({ name: order }),
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
    throw new Response('Forbidden', { status: 403 })
  }

  const { order, q, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys: SORT_KEYS,
  })

  const permissionWhere =
    viewPerms.hasOwn && !viewPerms.hasAny ? { id: context.userId } : {}

  // SQLite `contains` is case-insensitive for ASCII only; Czech diacritics
  // match case-sensitively (accepted limitation).
  const searchWhere =
    q === ''
      ? []
      : [{ OR: [{ email: { contains: q } }, { name: { contains: q } }] }]

  const where = { AND: [permissionWhere, ...searchWhere] }

  // Fetch users based on permissions
  const rawUsers = await prisma.user.findMany({
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
    canCreate: context.can({
      action: 'create',
      entity: 'user',
      targetUserId: context.userId,
    }).hasPermission,
    q,
    users,
  }
}
