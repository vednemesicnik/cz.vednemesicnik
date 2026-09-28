import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import {
  getWebContentVisibility,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const visibility = await getWebContentVisibility(request, [
    'podcast',
    'podcast_episode',
  ])

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
    where: visibility.where('podcast', ownByAuthor),
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
    where: visibility.where('podcast_episode', ownByAuthor),
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
      publishedAt: createFormattedDate(episode.publishedAt),
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
