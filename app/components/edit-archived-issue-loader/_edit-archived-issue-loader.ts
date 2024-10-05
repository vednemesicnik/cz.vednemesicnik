import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { type routesConfig } from "~/config/routes-config"
import { getAuthorization } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

type EditArchivedIssuePath =
  typeof routesConfig.administration.archive.editArchivedIssue.dynamicPath

type RouteParams = Record<ParamParseKey<EditArchivedIssuePath>, string>

export const editArchivedIssueLoader = async ({
  params,
  request,
}: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const { id } = params as RouteParams

  const archivedIssue = await prisma.archivedIssue.findUnique({
    where: { id: id },
    select: {
      id: true,
      label: true,
      publishedAt: true,
      published: true,
      cover: {
        select: {
          id: true,
          altText: true,
        },
      },
      pdf: {
        select: {
          id: true,
        },
      },
    },
  })

  if (archivedIssue === null)
    throw new Response(null, {
      status: 404,
      statusText: "Archived issue not found.",
    })

  return json({ archivedIssue })
}
