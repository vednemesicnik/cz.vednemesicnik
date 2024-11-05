import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { type routesConfig } from "~/config/routes-config"
import { prisma } from "~/utils/db.server"

type EditArchivedIssuePath =
  typeof routesConfig.administration.archive.editArchivedIssue.dynamicPath

type RouteParams = Record<ParamParseKey<EditArchivedIssuePath>, string>

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params as RouteParams

  const archivedIssue = await prisma.archivedIssue.findUniqueOrThrow({
    where: { id: id },
    select: {
      id: true,
      label: true,
      publishedAt: true,
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
    },
  })

  return json({ archivedIssue })
}
