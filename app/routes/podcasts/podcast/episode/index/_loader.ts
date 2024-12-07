import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { episodeSlug } = params

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
