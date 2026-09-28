import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  getWebContentVisibility,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'

import type { Route } from './+types/route'

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { episodeSlug } = params
  const visibility = await getWebContentVisibility(request, ['podcast_episode'])

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
        orderBy: { order: 'asc' },
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
      ...visibility.where('podcast_episode', ownByAuthor, [
        'draft',
        'archived',
      ]),
    },
  })

  return {
    podcastEpisode: {
      ...podcastEpisode,
      publishedAt: createFormattedDate(podcastEpisode.publishedAt),
    },
  }
}
