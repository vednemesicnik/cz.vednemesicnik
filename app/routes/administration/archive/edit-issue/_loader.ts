import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { getRights } from "~/utils/permissions"
import {
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
} from "~~/types/permission"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const authorPermissionEntity: AuthorPermissionEntity = "issue"
  const authorPermissionActions: AuthorPermissionAction[] = [
    "update",
    "publish",
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
      },
    },
  })

  const [[hasUpdateAnyRight]] = getRights(
    session.user.author.role.permissions,
    {
      actions: ["update"],
    }
  )

  const authorsPromise = prisma.author.findMany({
    ...(hasUpdateAnyRight ? {} : { where: { id: session.user.author.id } }),
    select: {
      id: true,
      name: true,
    },
  })

  const { issueId } = params

  const issuePromise = prisma.issue.findUniqueOrThrow({
    where: { id: issueId },
    select: {
      id: true,
      label: true,
      releasedAt: true,
      state: true,
      cover: {
        select: {
          id: true,
        },
      },
      pdf: {
        select: {
          id: true,
        },
      },
      author: {
        select: {
          id: true,
        },
      },
    },
  })

  const [issue, authors] = await Promise.all([issuePromise, authorsPromise])

  return { issue, session, authors }
}
