import { prisma } from '~/utils/db.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'
import { getAssignableRoles } from '~/utils/permissions/user/queries/get-assignable-roles.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { userId } = params

  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['user'],
  })

  const user = await prisma.user.findUniqueOrThrow({
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
    where: { id: userId },
  })

  // Check if user has permission to update this user
  checkUserPermission(context, {
    action: 'update',
    entity: 'user',
    targetUserId: user.id,
    targetUserRoleLevel: user.role.level,
  })

  // Get assignable roles with Owner constraint handling
  const roles = await getAssignableRoles(context, {
    targetUserId: user.id,
  })

  return { roles, user }
}
