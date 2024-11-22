import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { getRights } from "~/utils/permissions"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const session = await prisma.session.findUniqueOrThrow({
    where: {
      id: sessionId,
    },
    select: {
      user: {
        select: {
          authorId: true,
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
                  entity: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const [hasCreateAnyRight] = getRights(session.user.role.permissions, {
    actions: ["create"],
  })

  const authors = await prisma.author.findMany({
    ...(hasCreateAnyRight ? {} : { where: { id: session.user.authorId } }),
    select: {
      id: true,
      name: true,
    },
  })

  return json({ session, authors })
}
