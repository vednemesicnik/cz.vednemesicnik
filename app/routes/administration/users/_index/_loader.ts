import type { Prisma } from '@generated/prisma/client'
import { data } from 'react-router'

import { adminUsersSectionDeniedData } from '~/components/boundary-error/utils/boundary-copy'
import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { canDeleteUser } from '~/utils/permissions/user/guards/can-delete-user'
import { canEditUser } from '~/utils/permissions/user/guards/can-edit-user'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'
import { getLastSignIn } from './utils/get-last-sign-in'

// Every sort appends the name and then `createdAt desc` as tie-breakers so
// rows with equal values keep a deterministic order across reloads.
const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.UserOrderByWithRelationInput[]
> = {
  authorRole: (order) => [
    { author: { role: { level: order } } },
    { author: { name: 'asc' } },
    { createdAt: 'desc' },
  ],
  // The name belongs to the author (design 28f).
  name: (order) => [{ author: { name: order } }, { createdAt: 'desc' }],
  role: (order) => [
    { role: { level: order } },
    { author: { name: 'asc' } },
    { createdAt: 'desc' },
  ],
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getUserPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['user', 'author'],
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
    defaultOrder: 'asc',
    defaultSort: 'name',
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
      author: {
        select: {
          id: true,
          name: true,
          role: { select: { name: true } },
        },
      },
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

  // Poslední přihlášení: the newest sign-in of every listed account in one
  // query (28d).
  const lastSignIns = await prisma.authLog.groupBy({
    _max: { createdAt: true },
    by: ['userId'],
    where: {
      event: 'sign_in_success',
      userId: { in: rawUsers.map((user) => user.id) },
    },
  })

  const lastSignInAtByUserId = new Map(
    lastSignIns.map(({ _max, userId }) => [userId, _max.createdAt]),
  )

  const now = new Date()

  // Compute permissions for each user
  const users = rawUsers.map((user) => {
    const target = {
      targetUserId: user.id,
      targetUserRoleLevel: user.role.level,
    }

    return {
      ...user,
      canDelete: canDeleteUser(context, target),
      canUpdate: canEditUser(context, target),
      canView: context.can({ action: 'view', entity: 'user', ...target })
        .hasPermission,
      canViewAuthor: context.can({
        action: 'view',
        entity: 'author',
        targetUserId: user.id,
      }).hasPermission,
      // The signed-in person's own account, marked „vy“ (28d, as 28a).
      isOwn: user.id === context.userId,
      lastSignIn: getLastSignIn({
        accountCreatedAt: user.createdAt,
        lastSignInAt: lastSignInAtByUserId.get(user.id) ?? null,
        now,
      }),
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'user',
      targetUserId: context.userId,
    }).hasPermission,
    // Decides „dnes“ in Poslední přihlášení.
    now,
    query,
    users,
  }
}
