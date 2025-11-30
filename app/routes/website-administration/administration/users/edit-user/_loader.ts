import { type UserPermissionEntity } from "@generated/prisma/enums"
import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

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
              level: true,
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
          level: true,
        },
      },
    },
  })

  const [session, user] = await Promise.all([sessionPromise, userPromise])

  const roles = await prisma.userRole.findMany({
    where: {
      level: {
        gte: session.user.role.level,
      },
    },
    select: {
      id: true,
      name: true,
    },
  })

  return { session, user, roles }
}
