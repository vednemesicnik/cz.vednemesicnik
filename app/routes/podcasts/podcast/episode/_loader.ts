import { data, href } from 'react-router'

import type { NotFoundEpisodeData } from '~/components/boundary-error'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  getWebContentVisibility,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'

import type { Route } from './+types/route'

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { podcastSlug, episodeSlug } = params
  const visibility = await getWebContentVisibility(request, [
    'podcast',
    'podcast_episode',
  ])

  const podcastWhere = {
    slug: podcastSlug,
    ...visibility.where('podcast', ownByAuthor, ['draft', 'archived']),
  }

  const podcastEpisode = await prisma.podcastEpisode.findUnique({
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
      podcast: podcastWhere,
      slug: episodeSlug,
      ...visibility.where('podcast_episode', ownByAuthor, [
        'draft',
        'archived',
      ]),
    },
  })

  if (podcastEpisode === null) {
    // Design 30f offers `Na podcast` only when the podcast itself can be shown.
    const podcast = await prisma.podcast.findUnique({
      select: { slug: true },
      where: podcastWhere,
    })

    if (podcast === null) {
      throw data(null, { status: 404 })
    }

    const notFoundData: NotFoundEpisodeData = {
      podcastHref: href('/podcasts/:podcastSlug', {
        podcastSlug: podcast.slug,
      }),
    }

    throw data(notFoundData, { status: 404 })
  }

  return {
    podcastEpisode: {
      ...podcastEpisode,
      publishedAt: createFormattedDate(podcastEpisode.publishedAt),
    },
  }
}
