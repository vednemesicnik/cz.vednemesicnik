import { prisma } from "~/utils/db.server"
import { getFormattedPublishDate } from "~/utils/get-formatted-publish-date"
import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { authorId } = params

  const context = await getUserPermissionContext(request, {
    entities: ["author"],
    actions: ["view", "update", "delete"],
  })

  const author = await prisma.author.findUniqueOrThrow({
    where: { id: authorId },
    select: {
      id: true,
      name: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
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
          name: true,
        },
      },
    },
  })

  // targetUserId is the user who owns this author profile (or undefined for external authors)
  const targetUserId = author.user?.id

  // Check view permission
  const viewPerms = context.can({
    entity: "author",
    action: "view",
    targetUserId,
  })

  if (!viewPerms.hasPermission) {
    throw new Response("Forbidden", { status: 403 })
  }

  // Check update permission
  const updatePerms = context.can({
    entity: "author",
    action: "update",
    targetUserId,
  })

  // Check delete permission - cannot delete own author profile
  const deletePerms = context.can({
    entity: "author",
    action: "delete",
    targetUserId,
  })

  return {
    author: {
      id: author.id,
      name: author.name,
      bio: author.bio,
      createdAt: getFormattedPublishDate(author.createdAt),
      updatedAt: getFormattedPublishDate(author.updatedAt),
      role: author.role,
      user: author.user,
    },
    canUpdate: updatePerms.hasPermission,
    // Can only delete authors without linked User (onDelete: Restrict in schema)
    canDelete: deletePerms.hasPermission && !author.user,
  }
}
