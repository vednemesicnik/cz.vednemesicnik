import { data } from 'react-router'

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
import { findWebPodcast } from '~/utils/podcast/find-web-podcast.server'
import { NON_EMPTY_EPISODE_WHERE } from '~/utils/podcast-episode/non-empty-episode-where'

import type { Route } from './+types/route'

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { podcastSlug } = params
  const visibility = await getWebContentVisibility(request, [
    'podcast',
    'podcast_episode',
  ])

  // Only a published address is unique (log 0039).
  const webPodcast = await findWebPodcast(podcastSlug, visibility)

  if (webPodcast === null) {
    throw data(null, { status: 404 })
  }

  const podcast = await prisma.podcast.findUnique({
    select: {
      cover: {
        select: imageSourceSelect,
      },
      description: true,
      episodes: {
        // By number, the newest first: the number is how listeners know an
        // episode (27b).
        orderBy: [{ number: 'desc' }],
        select: {
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
          // The typed address: a signed-in author sees drafts here too, and a
          // published episode's is the one it holds (log 0039).
          slug: true,
          title: true,
        },
        // An empty draft never shows, not even as a preview (log 0020).
        where: {
          AND: [visibility.where('podcast_episode', ownByAuthor)],
          ...NON_EMPTY_EPISODE_WHERE,
        },
      },
      id: true,
      slug: true,
      title: true,
    },
    where: { id: webPodcast.id },
  })

  if (podcast === null) {
    throw data(null, { status: 404 })
  }

  const cover = {
    altText: podcast.cover?.altText ?? '',
    sources: createImageSources('podcast-cover', podcast.cover),
  }

  return {
    podcast: {
      ...podcast,
      cover,
      episodes: podcast.episodes.map((episode) => ({
        ...episode,
        publishedAt: createFormattedDate(episode.publishedAt),
      })),
    },
  }
}
