import { prisma } from "~/utils/db.server"
import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"
import { checkUserPermission } from "~/utils/permissions/user/guards/check-user-permission.server"
import { getAssignableRoles } from "~/utils/permissions/user/queries/get-assignable-roles.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { userId } = params

  const context = await getUserPermissionContext(request, {
    entities: ["user"],
    actions: ["update"],
  })

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
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
  })

  // Check if user has permission to update this user
  checkUserPermission(context, {
    entity: "user",
    action: "update",
    targetUserId: user.id,
    targetRoleLevel: user.role.level,
  })

  // Get assignable roles with Owner constraint handling
  const roles = await getAssignableRoles(context, {
    targetUserId: user.id,
  })

  return { user, roles }
}
