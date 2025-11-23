import { type LoaderFunctionArgs } from "react-router"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { type UserPermissionEntity } from "~~/types/permission"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const entities: UserPermissionEntity[] = ["user"]

  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      user: {
        select: {
          id: true,
          role: {
            select: {
              name: true,
              level: true,
              permissions: {
                where: {
                  entity: { in: entities },
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

  const users = await prisma.user.findMany({
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

  return { users, session }
}
