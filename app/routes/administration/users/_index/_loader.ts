import type { LoaderFunctionArgs } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const context = await getUserPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['user'],
  })

  // Check view permission - check if user can view at least themselves
  const viewOwnPerms = context.can({
    access: ['own'],
    action: 'view',
    entity: 'user',
    targetUserId: context.userId,
  })

  const viewAnyPerms = context.can({
    access: ['any'],
    action: 'view',
    entity: 'user',
  })

  // If user has no view permissions at all (neither own nor any), they shouldn't access this page
  if (!viewOwnPerms.hasPermission && !viewAnyPerms.hasPermission) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Fetch users based on permissions
  const rawUsers = await prisma.user.findMany({
    orderBy: {
      name: 'asc',
    },
    select: {
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
      username: true,
    },
    where:
      viewOwnPerms.hasPermission && !viewAnyPerms.hasPermission
        ? { id: context.userId }
        : {},
  })

  // Compute permissions for each user
  const users = rawUsers.map((user) => {
    return {
      ...user,
      canDelete:
        context.can({
          action: 'delete',
          entity: 'user',
          targetUserId: user.id,
        }).hasPermission && user.role.level >= context.roleLevel,
      canUpdate:
        context.can({
          action: 'update',
          entity: 'user',
          targetUserId: user.id,
        }).hasPermission && user.role.level >= context.roleLevel,
      canView:
        context.can({
          action: 'view',
          entity: 'user',
          targetUserId: user.id,
        }).hasPermission && user.role.level >= context.roleLevel,
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'user',
      targetUserId: context.userId,
    }).hasPermission,
    users,
  }
}
