import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"podcasts/:podcastSlug/:episodeSlug">,
  string
>

const DEFAULT_MAX_AGE = 60 * 30 // 30 minutes in seconds

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { episodeSlug } = params as RouteParams

  const episode = await prisma.podcastEpisode.findUniqueOrThrow({
    where: { slug: episodeSlug },
    select: {
      id: true,
      slug: true,
      number: true,
      title: true,
      description: true,
      publishedAt: true,
      links: {
        select: {
          id: true,
          label: true,
          url: true,
        },
      },
      cover: {
        select: {
          id: true,
          altText: true,
        },
      },
      podcast: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  return json(
    { episode },
    { headers: { "Cache-Control": `public, max-age=${DEFAULT_MAX_AGE}` } }
  )
}
