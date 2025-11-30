import { type LoaderFunctionArgs } from "react-router"

import { type UserPermissionEntity } from "@generated/prisma/enums"
import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

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
        in: ["member", "administrator"],
      },
    },
    select: {
      id: true,
      name: true,
    },
  })

  return { roles, session }
}
