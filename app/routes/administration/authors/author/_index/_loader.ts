import { prisma } from '~/utils/db.server'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { authorId } = params

  const context = await getUserPermissionContext(request, {
    actions: ['view', 'update', 'delete'],
    entities: ['author'],
  })

  const author = await prisma.author.findUniqueOrThrow({
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
      updatedAt: true,
      user: {
        select: {
          email: true,
          id: true,
          name: true,
        },
      },
    },
    where: { id: authorId },
  })

  // targetUserId is the user who owns this author profile (or undefined for external authors)
  const targetUserId = author.user?.id

  // Check view permission
  const viewPerms = context.can({
    action: 'view',
    entity: 'author',
    targetUserId,
  })

  if (!viewPerms.hasPermission) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Check update permission
  const updatePerms = context.can({
    action: 'update',
    entity: 'author',
    targetUserId,
  })

  // Check delete permission - cannot delete own author profile
  const deletePerms = context.can({
    action: 'delete',
    entity: 'author',
    targetUserId,
  })

  return {
    author: {
      bio: author.bio,
      createdAt: getFormattedPublishDate(author.createdAt),
      id: author.id,
      name: author.name,
      role: author.role,
      updatedAt: getFormattedPublishDate(author.updatedAt),
      user: author.user,
    },
    // Can only delete authors without linked User (onDelete: Restrict in schema)
    canDelete: deletePerms.hasPermission && !author.user,
    canUpdate: updatePerms.hasPermission,
  }
}
