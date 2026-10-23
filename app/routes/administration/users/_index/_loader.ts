import { data, redirect } from 'react-router'

import { adminUsersSectionDeniedData } from '~/components/boundary-error/utils/boundary-copy'
import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { buildLastPageRedirect } from '~/utils/build-last-page-redirect'
import { prisma } from '~/utils/db.server'
import { getOrderedPage } from '~/utils/get-ordered-page'
import { isPagePastLast } from '~/utils/is-page-past-last'
import { nameCollator } from '~/utils/name-collator'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { canDeleteUser } from '~/utils/permissions/user/guards/can-delete-user'
import { canEditUser } from '~/utils/permissions/user/guards/can-edit-user'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'
import { getLastSignIn } from './utils/get-last-sign-in'

const PAGE_SIZE = 20

type SortRow = {
  id: string
  name: string
  roleLevel: number
  authorRoleLevel: number
}

const byName = (first: SortRow, second: SortRow) =>
  nameCollator.compare(first.name, second.name)

// Ordered in memory, names the Czech way (SQLite compares bytes); every other
// sort breaks ties by name, so equal values keep one order across reloads. The
// name belongs to the author (design 28f).
const COMPARE: Record<
  SortKey,
  (order: SortOrder) => (first: SortRow, second: SortRow) => number
> = {
  authorRole: (order) => (first, second) =>
    (order === 'asc' ? 1 : -1) *
      (first.authorRoleLevel - second.authorRoleLevel) || byName(first, second),
  name: (order) => (first, second) =>
    (order === 'asc' ? 1 : -1) * byName(first, second),
  role: (order) => (first, second) =>
    (order === 'asc' ? 1 : -1) * (first.roleLevel - second.roleLevel) ||
    byName(first, second),
}

export const loader = async ({ request, url }: Route.LoaderArgs) => {
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

  const { order, page, query, sort } = parseAdminListParams(request, {
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

  const matchingUsers = await prisma.user.findMany({
    select: {
      author: {
        select: { name: true, role: { select: { level: true } } },
      },
      id: true,
      role: { select: { level: true } },
    },
    where,
  })

  // One page of 20, ordered here: names in Czech order (dj753f0j, 28d).
  const { pageIds, totalCount } = getOrderedPage(
    matchingUsers.map((user) => ({
      authorRoleLevel: user.author.role.level,
      id: user.id,
      name: user.author.name,
      roleLevel: user.role.level,
    })),
    COMPARE[sort](order),
    { page, pageSize: PAGE_SIZE },
  )

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Deleting the last row on the last page revalidates a URL past the end.
  if (isPagePastLast(page, totalPages)) {
    throw redirect(buildLastPageRedirect(url, totalPages))
  }

  const pageUsers = await prisma.user.findMany({
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
    where: { id: { in: pageIds } },
  })

  // The page's rows in the page's order; `in` returns them as SQLite has them.
  const rawUsers = [...pageUsers].sort(
    (first, second) => pageIds.indexOf(first.id) - pageIds.indexOf(second.id),
  )

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
    currentPage: page,
    // Decides „dnes“ in Poslední přihlášení.
    now,
    pageSize: PAGE_SIZE,
    query,
    totalCount,
    totalPages,
    users,
  }
}
