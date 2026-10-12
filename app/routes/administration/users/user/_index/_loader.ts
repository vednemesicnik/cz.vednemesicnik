import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { canEditUser } from '~/utils/permissions/user/guards/can-edit-user'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { userId } = params

  const context = await getUserPermissionContext(request, {
    actions: ['view', 'update', 'delete'],
    entities: ['user'],
  })

  const user = await prisma.user.findUniqueOrThrow({
    select: {
      author: {
        select: {
          id: true,
          name: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      },
      createdAt: true,
      email: true,
      id: true,
      image: {
        select: imageSourceSelect,
      },
      role: {
        select: {
          id: true,
          level: true,
          name: true,
        },
      },
      updatedAt: true,
      username: true,
    },
    where: { id: userId },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'user',
    targetUserId: user.id,
    targetUserRoleLevel: user.role.level,
  })

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!canView) {
    throw data(null, { status: 404 })
  }

  // Check update permission
  const canUpdate = canEditUser(context, {
    targetUserId: user.id,
    targetUserRoleLevel: user.role.level,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    action: 'delete',
    entity: 'user',
    targetUserId: user.id,
    targetUserRoleLevel: user.role.level,
  })

  return {
    canDelete,
    canUpdate,
    user: {
      author: user.author,
      createdAt: createFormattedDate(user.createdAt),
      email: user.email,
      hasImage: !!user.image,
      id: user.id,
      imageUrl: createImageSources('user-image', user.image).src ?? null,
      role: user.role,
      updatedAt: createFormattedDate(user.updatedAt),
      username: user.username,
    },
  }
}
