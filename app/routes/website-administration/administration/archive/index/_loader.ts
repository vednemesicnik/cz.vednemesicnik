import {
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
} from "@generated/prisma/enums"
import { getViewRights } from "~/routes/website-administration/administration/archive/index/utils/get-view-rights.server"
import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

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
                  name: true,
                  permissions: {
                    where: {
                      entity: authorPermissionEntity,
                      action: { in: authorPermissionActions },
                    },
                    select: {
                      entity: true,
                      action: true,
                      access: true,
                      state: true,
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

  const {
    hasViewOwnDraftIssueRight,
    hasViewOwnPublishedIssueRight,
    hasViewOwnArchivedIssueRight,
    hasViewAnyDraftIssueRight,
    hasViewAnyPublishedIssueRight,
    hasViewAnyArchivedIssueRight,
  } = getViewRights({ permissions: session.user.author.role.permissions })

  const issues = await prisma.issue.findMany({
    where: {
      OR: [
        {
          state: "draft",
          ...(hasViewOwnDraftIssueRight && !hasViewAnyDraftIssueRight
            ? { authorId: session.user.author.id }
            : {}),
        },
        {
          state: "published",
          ...(hasViewOwnPublishedIssueRight && !hasViewAnyPublishedIssueRight
            ? { authorId: session.user.author.id }
            : {}),
        },
        {
          state: "archived",
          ...(hasViewOwnArchivedIssueRight && !hasViewAnyArchivedIssueRight
            ? { authorId: session.user.author.id }
            : {}),
        },
      ],
    },
    orderBy: {
      releasedAt: "desc",
    },
    select: {
      id: true,
      label: true,
      state: true,
      authorId: true,
    },
  })

  return { issues, session }
}
