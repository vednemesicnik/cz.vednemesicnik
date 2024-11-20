import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"

type RouteParams = Record<ParamParseKey<"/podcasts/:podcastSlug">, string>

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { podcastSlug } = params as RouteParams

  const podcast = await prisma.podcast.findUniqueOrThrow({
    where: { slug: podcastSlug },
    select: { title: true },
  })

  return json({ podcast })
}
