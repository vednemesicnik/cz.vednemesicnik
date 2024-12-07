import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { podcastSlug } = params

  const podcast = await prisma.podcast.findUniqueOrThrow({
    where: { slug: podcastSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      episodes: {
        where: {
          state: "published",
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

  return { podcast }
}
