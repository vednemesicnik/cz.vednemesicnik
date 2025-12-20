import { href } from "react-router"

import { prisma } from "~/utils/db.server"
import { getFormattedPublishDate } from "~/utils/get-formatted-publish-date"
import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { userId } = params

  const context = await getUserPermissionContext(request, {
    entities: ["user"],
    actions: ["view", "update", "delete"],
  })

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: {
          id: true,
          name: true,
          level: true,
        },
      },
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
      image: {
        select: {
          id: true,
        },
      },
    },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    entity: "user",
    action: "view",
    targetUserId: user.id,
    targetUserRoleLevel: user.role.level,
  })

  if (!canView) {
    throw new Response("Forbidden", { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    entity: "user",
    action: "update",
    targetUserId: user.id,
    targetUserRoleLevel: user.role.level,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    entity: "user",
    action: "delete",
    targetUserId: user.id,
    targetUserRoleLevel: user.role.level,
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      createdAt: getFormattedPublishDate(user.createdAt),
      updatedAt: getFormattedPublishDate(user.updatedAt),
      role: user.role,
      author: user.author,
      hasImage: !!user.image,
      imageUrl: user.image
        ? href("/resources/user-image/:userId", { userId: user.image.id })
        : null,
    },
    canUpdate,
    canDelete,
  }
}
