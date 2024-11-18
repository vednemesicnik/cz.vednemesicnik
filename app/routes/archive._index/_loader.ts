import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node"

import { LIMIT_PARAM } from "~/components/load-more-content"
import { prisma } from "~/utils/db.server"

const DEFAULT_MAX_AGE = 60 * 30 // 30 minutes in seconds

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const limit = url.searchParams.get(LIMIT_PARAM)

  if (!limit) {
    url.searchParams.set(LIMIT_PARAM, "20")
    throw redirect(url.toString(), { status: 301 })
  }

  const archivedIssues = await prisma.archivedIssue.findMany({
    where: {
      published: true,
    },
    orderBy: {
      publishedAt: "desc",
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

  return json(
    { archivedIssues },
    { headers: { "Cache-Control": `public, max-age=${DEFAULT_MAX_AGE}` } }
  )
}
