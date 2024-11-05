import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/:podcastId">,
  string
>
export const loader = async ({ params }: LoaderFunctionArgs) => {
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
          published: true,
        },
        orderBy: { publishedAt: "desc" },
      },
    },
  })

  return json({ podcast })
}
