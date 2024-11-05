import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/edit-podcast/:podcastId">,
  string
>
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { podcastId } = params as RouteParams

  const podcast = await prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      cover: {
        select: {
          id: true,
        },
      },
    },
  })

  return json({ podcast })
}
