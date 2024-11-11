import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

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
                  entity: "user",
                },
                select: {
                  action: true,
                  access: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  return json({ roles, session })
}
