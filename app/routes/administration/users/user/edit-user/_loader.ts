import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { canEditUser } from '~/utils/permissions/user/guards/can-edit-user'
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
      author: {
        select: {
          id: true,
          name: true,
        },
      },
      email: true,
      id: true,
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

  // Only an Administrator or the Owner edits accounts here; the generic denial (design 30h)
  if (
    !canEditUser(context, {
      targetUserId: user.id,
      targetUserRoleLevel: user.role.level,
    })
  ) {
    throw data(null, { status: 403 })
  }

  // Get assignable roles with Owner constraint handling
  const roles = await getAssignableRoles(context, {
    targetUserId: user.id,
  })

  return { roles, user }
}
