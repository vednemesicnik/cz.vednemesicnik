import { prisma } from '~/utils/db.server'
import { getAssignableAuthorRoles } from '~/utils/permissions/author/queries/get-assignable-author-roles.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { authorId } = params

  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['author'],
  })

  const author = await prisma.author.findUniqueOrThrow({
    select: {
      bio: true,
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
          id: true,
        },
      },
    },
    where: { id: authorId },
  })

  // targetUserId is the user who owns this author profile
  const targetUserId = author.user?.id

  // Check if user has permission to update this author
  checkUserPermission(context, {
    action: 'update',
    entity: 'author',
    targetUserId,
  })

  // Get assignable roles based on user's role
  const roles = await getAssignableAuthorRoles(context, authorId)

  return { author, roles }
}
