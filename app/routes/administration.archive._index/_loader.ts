import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { canReadAny } from "~/utils/permissions"

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
                  action: { in: ["read", "create", "update", "delete"] },
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

  const archivedIssues = await prisma.archivedIssue.findMany({
    ...(canReadAny(session.user.role.permissions)
      ? {}
      : {
          where: {
            author: {
              id: session.user.id,
            },
          },
        }),
    orderBy: {
      publishedAt: "desc",
    },
    select: {
      id: true,
      label: true,
      published: true,
      author: {
        select: {
          id: true,
        },
      },
    },
  })

  return json({ archivedIssues, session })
}
