import { json } from "@remix-run/node"

import { prisma } from "~/utils/db.server"

export const loader = async () => {
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
