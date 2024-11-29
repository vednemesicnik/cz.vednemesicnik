import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/:podcastId">,
  string
>
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuthentication(request)

  const { podcastId } = params as RouteParams

  const podcast = await prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: {
      id: true,
      title: true,
      episodes: {
        select: {
          id: true,
          title: true,
          publishedAt: true,
          state: true,
        },
        orderBy: { publishedAt: "desc" },
      },
    },
  })

  return json({ podcast })
}
