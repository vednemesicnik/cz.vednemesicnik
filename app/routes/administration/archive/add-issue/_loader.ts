import { redirect } from "react-router"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { getAuthorRights } from "~/utils/get-author-rights"
import {
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
} from "~~/types/permission"

import type { Route } from "./+types/route"

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const authorPermissionEntity: AuthorPermissionEntity = "issue"
  const authorPermissionActions: AuthorPermissionAction[] = [
    "create",
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
                  name: true,
                  permissions: {
                    where: {
                      entity: authorPermissionEntity,
                      action: { in: authorPermissionActions },
                    },
                    select: {
                      action: true,
                      access: true,
                      entity: true,
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

  const [
    // entity: issue
    [
      // action: create
      [
        // access: own
        [hasCreateOwnIssueRight],
        // access: any
        [hasCreateAnyIssueRight],
      ],
    ],
  ] = getAuthorRights(session.user.author.role.permissions, {
    entities: ["issue"],
    actions: ["create"],
    access: ["own", "any"],
  })

  const canCreateIssue = hasCreateOwnIssueRight || hasCreateAnyIssueRight

  if (!canCreateIssue) {
    redirect("/administration/archive")
  }

  const authors = await prisma.author.findMany({
    ...(hasCreateAnyIssueRight
      ? {}
      : { where: { id: session.user.author.id } }),
    select: {
      id: true,
      name: true,
    },
  })

  return { session, authors }
}
