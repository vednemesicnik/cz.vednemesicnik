import { type LoaderFunctionArgs } from "react-router"

import { prisma } from "~/utils/db.server"
import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const context = await getUserPermissionContext(request, {
    entities: ["user"],
    actions: ["view", "create", "update", "delete"],
  })

  // Check view permission - check if user can view at least themselves
  const viewOwnPerms = context.can({
    entity: "user",
    action: "view",
    access: ["own"],
    targetUserId: context.userId,
  })

  const viewAnyPerms = context.can({
    entity: "user",
    action: "view",
    access: ["any"],
  })

  // If user has no view permissions at all (neither own nor any), they shouldn't access this page
  if (!viewOwnPerms.hasPermission && !viewAnyPerms.hasPermission) {
    throw new Response("Forbidden", { status: 403 })
  }

  // Fetch users based on permissions
  const rawUsers = await prisma.user.findMany({
    where: viewOwnPerms.hasPermission && !viewAnyPerms.hasPermission
      ? { id: context.userId }
      : {},
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: {
        select: {
          id: true,
          name: true,
          level: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  // Compute permissions for each user
  const users = rawUsers.map((user) => {
    return {
      ...user,
      canView:
        context.can({
          entity: "user",
          action: "view",
          targetUserId: user.id,
        }).hasPermission && user.role.level >= context.roleLevel,
      canUpdate:
        context.can({
          entity: "user",
          action: "update",
          targetUserId: user.id,
        }).hasPermission && user.role.level >= context.roleLevel,
      canDelete:
        context.can({
          entity: "user",
          action: "delete",
          targetUserId: user.id,
        }).hasPermission && user.role.level >= context.roleLevel,
    }
  })

  return {
    users,
    canCreate: context.can({
      entity: "user",
      action: "create",
      targetUserId: context.userId,
    }).hasPermission,
  }
}
