import { redirect } from "react-router"

import {
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
} from "@generated/prisma/enums"
import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { getAuthorRights } from "~/utils/get-author-rights"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const authorPermissionEntity: AuthorPermissionEntity = "issue"
  const authorPermissionActions: AuthorPermissionAction[] = [
    "update",
    "publish",
    "retract",
    "archive",
    "restore",
  ]

  const sessionPromise = prisma.session.findUniqueOrThrow({
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

  const { issueId } = params

  const issuePromise = prisma.issue.findUniqueOrThrow({
    where: { id: issueId },
    select: {
      id: true,
      label: true,
      releasedAt: true,
      state: true,
      publishedAt: true,
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

  const [session, issue] = await Promise.all([sessionPromise, issuePromise])

  const [
    // entity: issue
    [
      // action: update
      [
        // access: own
        [hasUpdateOwnRight],
        // access: any
        [hasUpdateAnyRight],
      ],
    ],
  ] = getAuthorRights(session.user.author.role.permissions, {
    entities: ["issue"],
    actions: ["update"],
    access: ["own", "any"],
    ownId: session.user.author.id,
    targetId: issue.author.id,
  })

  const canUpdateIssue = hasUpdateOwnRight || hasUpdateAnyRight

  if (!canUpdateIssue) {
    throw redirect("/administration/archive")
  }

  const authors = await prisma.author.findMany({
    ...(hasUpdateAnyRight ? {} : { where: { id: session.user.author.id } }),
    select: {
      id: true,
      name: true,
    },
  })

  return { issue, session, authors }
}
