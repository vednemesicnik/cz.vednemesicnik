import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { getRights } from "~/utils/permissions"
import {
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
} from "~~/types/permission"

import type { Route } from "./+types/route"

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const authorPermissionEntity: AuthorPermissionEntity = "issue"
  const authorPermissionActions: AuthorPermissionAction[] = [
    "view",
    "create",
    "update",
    "delete",
  ]

  const session = await prisma.session.findUniqueOrThrow({
    where: {
      id: sessionId,
    },
    select: {
      user: {
        select: {
          author: {
            select: {
              id: true,
              role: {
                select: {
                  permissions: {
                    where: {
                      entity: authorPermissionEntity,
                      action: { in: authorPermissionActions },
                    },
                    select: {
                      entity: true,
                      action: true,
                      access: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const [[canViewAny]] = getRights(session.user.author.role.permissions, {
    actions: ["view"],
  })

  const issues = await prisma.issue.findMany({
    ...(canViewAny
      ? {}
      : {
          where: {
            author: {
              id: session.user.author.id,
            },
          },
        }),
    orderBy: {
      publishedAt: "desc",
    },
    select: {
      id: true,
      label: true,
      state: true,
      author: {
        select: {
          id: true,
        },
      },
    },
  })

  return { archivedIssues: issues, session }
}
