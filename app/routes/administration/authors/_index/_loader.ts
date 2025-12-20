import type { LoaderFunctionArgs } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
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

  // Fetch authors based on permissions
  // If user only has "own" permission, filter to only their author profile
  const rawAuthors = await prisma.author.findMany({
    orderBy: {
      name: 'asc',
    },
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
          email: true,
          id: true,
        },
      },
    },
    where:
      viewPerms.hasOwn && !viewPerms.hasAny
        ? { user: { id: context.userId } }
        : {},
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
  }
}
