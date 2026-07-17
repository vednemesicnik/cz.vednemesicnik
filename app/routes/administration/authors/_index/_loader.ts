import type { Prisma } from '@generated/prisma/client'

import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.AuthorOrderByWithRelationInput
> = {
  createdAt: (order) => ({ createdAt: order }),
  email: (order) => ({ user: { email: order } }),
  name: (order) => ({ name: order }),
  role: (order) => ({ role: { name: order } }),
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getUserPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['author'],
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

  const { order, q, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys: SORT_KEYS,
  })

  // If user only has "own" permission, filter to only their author profile.
  const permissionWhere =
    viewPerms.hasOwn && !viewPerms.hasAny
      ? { user: { id: context.userId } }
      : {}

  // SQLite `contains` is case-insensitive for ASCII only; Czech diacritics
  // match case-sensitively (accepted limitation).
  const where = {
    AND: [permissionWhere, ...(q === '' ? [] : [{ name: { contains: q } }])],
  }

  const rawAuthors = await prisma.author.findMany({
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
  })

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
    authors,
    canCreate: createPerms.hasAny, // Only "any" access can create new authors
    q,
  }
}
