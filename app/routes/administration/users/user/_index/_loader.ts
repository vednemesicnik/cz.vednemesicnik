import { href } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

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
        select: {
          id: true,
        },
      },
      name: true,
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

  if (!canView) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    action: 'update',
    entity: 'user',
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
      createdAt: getFormattedPublishDate(user.createdAt),
      email: user.email,
      hasImage: !!user.image,
      id: user.id,
      imageUrl: user.image
        ? href('/resources/user-image/:userId', { userId: user.image.id })
        : null,
      name: user.name,
      role: user.role,
      updatedAt: getFormattedPublishDate(user.updatedAt),
      username: user.username,
    },
  }
}
