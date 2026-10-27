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
import { NON_EMPTY_EPISODE_WHERE } from '~/utils/podcast-episode/non-empty-episode-where'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const visibility = await getWebContentVisibility(request, [
    'podcast',
    'podcast_episode',
  ])

  const podcastWhere = visibility.where('podcast', ownByAuthor)

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
    where: podcastWhere,
  })

  const episodesPromise = prisma.podcastEpisode.findMany({
    orderBy: {
      publishedAt: 'desc',
    },
    select: {
      id: true,
      number: true,
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
      // The typed address: a signed-in author sees drafts here too, and a
      // published episode's is the one it holds (log 0039).
      slug: true,
      title: true,
    },
    take: 10,
    // Only episodes of a podcast listed here: the episode page 404s otherwise (27f).
    where: {
      ...visibility.where('podcast_episode', ownByAuthor),
      // An empty draft never shows, not even as a preview (log 0020).
      ...NON_EMPTY_EPISODE_WHERE,
      podcast: podcastWhere,
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
