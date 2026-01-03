import { getAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { episodeSlug } = params
  const { isAuthenticated } = await getAuthentication(request)

  const podcastEpisode = await prisma.podcastEpisode.findUniqueOrThrow({
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
    where: {
      slug: episodeSlug,
      state: {
        in: isAuthenticated
          ? ['draft', 'published', 'archived']
          : ['published'],
      },
    },
  })

  return { podcastEpisode }
}
