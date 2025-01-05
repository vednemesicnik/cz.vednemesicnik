import { type LoaderFunctionArgs } from "react-router"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { type UserPermissionEntity } from "~~/types/permission"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const entity: UserPermissionEntity = "user"

  const session = await prisma.session.findUniqueOrThrow({
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

  const roles = await prisma.userRole.findMany({
    where: {
      name: {
        in: ["user", "administrator"],
      },
    },
    select: {
      id: true,
      name: true,
    },
  })

  return { roles, session }
}
