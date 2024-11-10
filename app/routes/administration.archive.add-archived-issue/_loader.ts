import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { canCreateAny } from "~/utils/permissions"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const session = await prisma.session.findUniqueOrThrow({
    where: {
      id: sessionId,
    },
    select: {
      user: {
        select: {
          id: true,
          role: {
            select: {
              permissions: {
                where: {
                  entity: "archived_issue",
                  action: { in: ["create", "publish"] },
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

  const users = await prisma.user.findMany({
    ...(canCreateAny(session.user.role.permissions)
      ? {}
      : {
          where: {
            id: session.user.id,
          },
        }),
    select: {
      id: true,
      name: true,
    },
  })

  return json({ session, users })
}
