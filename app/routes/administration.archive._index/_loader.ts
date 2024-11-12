import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { canReadEntities } from "~/utils/permissions"
import {
  type PermissionAction,
  type PermissionEntity,
} from "~~/types/permission"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const archivedIssueEntity: PermissionEntity = "archived_issue"
  const archivedIssueActions: PermissionAction[] = [
    "read",
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
          id: true,
          role: {
            select: {
              permissions: {
                where: {
                  entity: archivedIssueEntity,
                  action: { in: archivedIssueActions },
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
  })

  const [canReadAnyArchivedIssues] = canReadEntities(
    [archivedIssueEntity],
    session.user.role.permissions
  )

  const archivedIssues = await prisma.archivedIssue.findMany({
    ...(canReadAnyArchivedIssues
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
