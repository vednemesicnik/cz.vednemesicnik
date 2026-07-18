import { getAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { isAuthenticated } = await getAuthentication(request)

  const podcastsPromise = prisma.podcast.findMany({
    orderBy: {
      publishedAt: 'desc',
    },
    select: {
      cover: {
        select: imageSourceSelect,
      },
      id: true,
      slug: true,
      title: true,
    },
    where: {
      state: {
        in: isAuthenticated ? ['published', 'draft'] : ['published'],
      },
    },
  })

  const episodesPromise = prisma.podcastEpisode.findMany({
    orderBy: {
      publishedAt: 'desc',
    },
    select: {
      id: true,
      podcast: {
        select: {
          cover: {
            select: imageSourceSelect,
          },
          id: true,
          slug: true,
          title: true,
        },
      },
      publishedAt: true,
      slug: true,
      title: true,
    },
    take: 10,
    where: {
      state: {
        in: isAuthenticated ? ['published', 'draft'] : ['published'],
      },
    },
  })

  const [podcasts, episodes] = await Promise.all([
    podcastsPromise,
    episodesPromise,
  ])

  return {
    episodes: episodes.map((episode) => ({
      ...episode,
      podcast: {
        ...episode.podcast,
        cover: {
          altText: episode.podcast.cover?.altText ?? '',
          sources: createImageSources('podcast-cover', episode.podcast.cover),
        },
      },
    })),
    podcasts: podcasts.map((podcast) => ({
      ...podcast,
      cover: {
        altText: podcast.cover?.altText ?? '',
        sources: createImageSources('podcast-cover', podcast.cover),
      },
    })),
  }
}
