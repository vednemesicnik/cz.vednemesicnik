import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node"

import { getAuthorization } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const archivedIssues = await prisma.archivedIssue.findMany({
    orderBy: {
      publishedAt: "desc",
    },
    select: {
      id: true,
      label: true,
      published: true,
    },
  })

  return json({ archivedIssues })
}
