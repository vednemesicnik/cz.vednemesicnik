import { type LoaderFunctionArgs } from "react-router"

import { prisma } from "~/utils/db.server"
import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const context = await getUserPermissionContext(request, {
    entities: ["author"],
    actions: ["view", "create", "update", "delete"],
  })

  // Check if user has any view permission for authors
  // We check against own userId to see if they have at least "own" access
  const viewPerms = context.can({
    entity: "author",
    action: "view",
    targetUserId: context.userId,
  })

  // If user has no view permissions at all, they shouldn't access this page
  if (!viewPerms.hasPermission) {
    throw new Response("Forbidden", { status: 403 })
  }

  // Fetch authors based on permissions
  // If user only has "own" permission, filter to only their author profile
  const rawAuthors = await prisma.author.findMany({
    where:
      viewPerms.hasOwn && !viewPerms.hasAny
        ? { user: { id: context.userId } }
        : {},
    select: {
      id: true,
      name: true,
      bio: true,
      role: {
        select: {
          id: true,
          name: true,
          level: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  // Compute permissions for each author
  // targetUserId is the user who owns this author profile (or undefined for external authors)
  const authors = rawAuthors.map((author) => {
    const targetUserId = author.user?.id

    return {
      ...author,
      canView: context.can({
        entity: "author",
        action: "view",
        targetUserId,
      }).hasPermission,
      canUpdate: context.can({
        entity: "author",
        action: "update",
        targetUserId,
      }).hasPermission,
      // Can only delete authors without linked User (onDelete: Restrict in schema)
      canDelete:
        context.can({
          entity: "author",
          action: "delete",
          targetUserId,
        }).hasPermission && !author.user,
    }
  })

  // Create doesn't need targetUserId - it's creating a new author
  const createPerms = context.can({
    entity: "author",
    action: "create",
  })

  return {
    authors,
    canCreate: createPerms.hasAny, // Only "any" access can create new authors
  }
}
