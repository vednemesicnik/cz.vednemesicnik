import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { canEditUser } from '~/utils/permissions/user/guards/can-edit-user'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { userId } = params

  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['user'],
  })

  const user = await prisma.user.findUnique({
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
    },
    where: { id: userId },
  })

  if (user === null) {
    throw data(null, { status: 404 })
  }

  // Only an Administrator or the Owner edits accounts here; the generic denial (design 30h)
  if (
    !canEditUser(context, {
      targetUserId: user.id,
      targetUserRoleLevel: user.role.level,
    })
  ) {
    throw data(null, { status: 403 })
  }

  return {
    // Unticking the box on one's own account asks first (28g).
    isOwnAccount: user.id === context.userId,
    // The Owner's role never changes, so the Owner's edit has no box (log 0003).
    isOwner: user.role.name === 'owner',
    user,
  }
}
