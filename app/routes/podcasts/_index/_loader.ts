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
import { NON_EMPTY_PODCAST_WHERE } from '~/utils/podcast/non-empty-podcast-where'
import { NON_EMPTY_EPISODE_WHERE } from '~/utils/podcast-episode/non-empty-episode-where'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const visibility = await getWebContentVisibility(request, [
    'podcast',
    'podcast_episode',
  ])

  // An empty draft never shows, not even as a preview (log 0020).
  const podcastWhere = {
    AND: [visibility.where('podcast', ownByAuthor)],
    ...NON_EMPTY_PODCAST_WHERE,
  }

  const podcastsPromise = prisma.podcast.findMany({
    orderBy: {
      publishedAt: 'desc',
    },
    select: {
      cover: {
        select: imageSourceSelect,
      },
      id: true,
      // The typed address: a signed-in author sees drafts here too, and a
      // published podcast's is the one it holds (log 0039).
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
      cover: {
        select: imageSourceSelect,
      },
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
    episodes: episodes.map(({ cover, podcast, ...episode }) => ({
      ...episode,
      // The episode's own cover, otherwise the podcast's (13a).
      cover:
        cover === null
          ? {
              altText: podcast.cover?.altText ?? '',
              sources: createImageSources('podcast-cover', podcast.cover),
            }
          : {
              altText: cover.altText,
              sources: createImageSources('podcast-episode-cover', cover),
            },
      podcast: { id: podcast.id, slug: podcast.slug, title: podcast.title },
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
