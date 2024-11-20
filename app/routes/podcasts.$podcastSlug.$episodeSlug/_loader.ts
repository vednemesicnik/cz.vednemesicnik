import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"/podcasts/:podcastSlug/:episodeSlug">,
  string
>

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { episodeSlug } = params as RouteParams

  const podcastEpisode = await prisma.podcastEpisode.findUniqueOrThrow({
    where: { slug: episodeSlug },
    select: { title: true },
  })

  return json({ podcastEpisode })
}
