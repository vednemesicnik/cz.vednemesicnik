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

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { podcastSlug } = params
  const visibility = await getWebContentVisibility(request, [
    'podcast',
    'podcast_episode',
  ])

  const podcast = await prisma.podcast.findUniqueOrThrow({
    select: {
      cover: {
        select: imageSourceSelect,
      },
      description: true,
      episodes: {
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
          slug: true,
          title: true,
        },
        where: visibility.where('podcast_episode', ownByAuthor),
      },
      id: true,
      slug: true,
      title: true,
    },
    where: {
      slug: podcastSlug,
      ...visibility.where('podcast', ownByAuthor, ['draft', 'archived']),
    },
  })

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
