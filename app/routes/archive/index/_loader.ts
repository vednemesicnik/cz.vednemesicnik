import { type LoaderFunctionArgs, redirect } from "react-router"

import { LIMIT_PARAM } from "~/components/load-more-content"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const limit = url.searchParams.get(LIMIT_PARAM)

  if (!limit) {
    url.searchParams.set(LIMIT_PARAM, "20")
    throw redirect(url.toString(), { status: 301 })
  }

  const issuesPromise = prisma.issue.findMany({
    where: {
      state: "published",
    },
    orderBy: {
      releasedAt: "desc",
    },
    take: Number(limit),
    select: {
      id: true,
      label: true,
      cover: {
        select: {
          id: true,
          altText: true,
        },
      },
      pdf: {
        select: {
          id: true,
          fileName: true,
        },
      },
    },
  })

  const issuesCountPromise = prisma.issue.count({
    where: {
      state: "published",
    },
  })

  const [issues, issuesCount] = await Promise.all([
    issuesPromise,
    issuesCountPromise,
  ])

  return { issues, issuesCount }
}
