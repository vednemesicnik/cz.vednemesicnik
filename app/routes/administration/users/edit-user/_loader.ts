import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { getRights } from "~/utils/permissions"
import { type UserPermissionEntity } from "~~/types/permission"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { userId } = params
  const { sessionId } = await requireAuthentication(request)

  const entity: UserPermissionEntity = "user"

  const sessionPromise = prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      user: {
        select: {
          id: true,
          role: {
            select: {
              permissions: {
                where: {
                  entity,
                },
                select: {
                  action: true,
                  access: true,
                  entity: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const userPromise = prisma.user.findUniqueOrThrow({
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
        },
      },
    },
  })

  const [session, user] = await Promise.all([sessionPromise, userPromise])

  const [[canAssignRoleOwner, canAssignRoleAdministrator, canAssignRoleUser]] =
    getRights(session.user.role.permissions, {
      actions: [
        "assign_role_owner",
        "assign_role_administrator",
        "assign_role_user",
      ],
      access: ["any", "own"],
    })

  const roles = await prisma.userRole.findMany({
    where: {
      name: {
        in: [
          ...(canAssignRoleOwner ? ["owner"] : []),
          ...(canAssignRoleAdministrator ? ["administrator"] : []),
          ...(canAssignRoleUser ? ["user"] : []),
        ],
      },
    },
    select: {
      id: true,
      name: true,
    },
  })

  return { session, user, roles }
}
