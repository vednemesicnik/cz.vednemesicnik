import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node"

import { LIMIT_PARAM } from "~/components/load-more-content"
import { prisma } from "~/utils/db.server"

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

  // throw new Error("Loader error: Archive loader is not implemented yet.")

  return json({ archivedIssues })
}
