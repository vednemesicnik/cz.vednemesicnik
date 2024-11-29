import { type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"podcasts/:podcastSlug/:episodeSlug">,
  string
>

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

  return { episode }
}
