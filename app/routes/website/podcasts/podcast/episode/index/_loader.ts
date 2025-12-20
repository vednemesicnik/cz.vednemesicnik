import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { episodeSlug } = params

  const episode = await prisma.podcastEpisode.findUniqueOrThrow({
    select: {
      cover: {
        select: {
          altText: true,
          id: true,
        },
      },
      description: true,
      id: true,
      links: {
        select: {
          id: true,
          label: true,
          url: true,
        },
      },
      number: true,
      podcast: {
        select: {
          id: true,
          title: true,
        },
      },
      publishedAt: true,
      slug: true,
      title: true,
    },
    where: { slug: episodeSlug },
  })

  return { episode }
}
