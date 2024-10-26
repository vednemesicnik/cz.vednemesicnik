import { json } from "@remix-run/node"

import { prisma } from "~/utils/db.server"

export const loader = async () => {
  const latestArchivedIssuesPromise = prisma.archivedIssue.findMany({
    where: {
      published: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 1,
    select: {
      id: true,
      label: true,
      pdf: {
        select: {
          id: true,
          fileName: true,
        },
      },
      cover: {
        select: {
          id: true,
          altText: true,
        },
      },
    },
  })

  const [latestArchivedIssues] = await Promise.all([
    latestArchivedIssuesPromise,
  ])

  return json({ latestArchivedIssues })
}
