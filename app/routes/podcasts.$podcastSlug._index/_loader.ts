import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"

type RouteParams = Record<ParamParseKey<"podcasts/:podcastSlug">, string>
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { podcastSlug } = params as RouteParams

  const podcast = await prisma.podcast.findUniqueOrThrow({
    where: { slug: podcastSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      episodes: {
        where: {
          published: true,
        },
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
        },
      },
      cover: {
        select: {
          id: true,
          altText: true,
        },
      },
    },
  })

  return json({ podcast })
}
