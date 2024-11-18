import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"/podcasts/:podcastSlug/:episodeSlug">,
  string
>

const DEFAULT_MAX_AGE = 60 * 30 // 30 minutes in seconds

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { episodeSlug } = params as RouteParams

  const podcastEpisode = await prisma.podcastEpisode.findUniqueOrThrow({
    where: { slug: episodeSlug },
    select: { title: true },
  })

  return json(
    { podcastEpisode },
    { headers: { "Cache-Control": `public, max-age=${DEFAULT_MAX_AGE}` } }
  )
}
