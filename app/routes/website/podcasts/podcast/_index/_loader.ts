import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { podcastSlug } = params

  const podcast = await prisma.podcast.findUniqueOrThrow({
    select: {
      cover: {
        select: {
          altText: true,
          id: true,
        },
      },
      description: true,
      episodes: {
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
          publishedAt: true,
          slug: true,
          title: true,
        },
        where: {
          state: 'published',
        },
      },
      id: true,
      slug: true,
      title: true,
    },
    where: { slug: podcastSlug },
  })

  return { podcast }
}
