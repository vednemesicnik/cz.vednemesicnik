import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { type routesConfig } from "~/config/routes-config"
import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { canUpdateAny } from "~/utils/permissions"

type EditArchivedIssuePath =
  typeof routesConfig.administration.archive.editArchivedIssue.dynamicPath

type RouteParams = Record<ParamParseKey<EditArchivedIssuePath>, string>

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
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
                  action: { in: ["update", "publish"] },
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
    ...(canUpdateAny(session.user.role.permissions)
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

  const { id } = params as RouteParams

  const archivedIssue = await prisma.archivedIssue.findUniqueOrThrow({
    where: { id: id },
    select: {
      id: true,
      label: true,
      releasedAt: true,
      published: true,
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

  return json({ archivedIssue, session, users })
}
