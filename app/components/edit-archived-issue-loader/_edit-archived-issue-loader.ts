import type { LoaderFunctionArgs } from "@remix-run/node"
import { redirect, json } from "@remix-run/node"
import { prisma } from "~/utils/db.server"
import type { ParamParseKey } from "@remix-run/router"
import { getAuthSession } from "~/utils/auth.server"

const ROUTE = "archive/edit-issue/:id"
type RouteParams = Record<ParamParseKey<typeof ROUTE>, string>

export const editArchivedIssueLoader = async ({ params, request }: LoaderFunctionArgs) => {
  const authSession = await getAuthSession(request)
  const userId = authSession.get("userId")

  if (userId === undefined) {
    throw redirect("/administration/signin")
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

  if (archivedIssue === null) throw new Response(null, { status: 404, statusText: "Archived issue not found." })

  return json({ archivedIssue })
}
