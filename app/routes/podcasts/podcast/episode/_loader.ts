import type { Prisma } from '@generated/prisma/client'
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

  const select = {
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
  } satisfies Prisma.PodcastEpisodeSelect

  const previewId = new URL(request.url).searchParams.get('id')
  const visibleWhere = {
    podcast: podcastWhere,
    ...visibility.where('podcast_episode', ownByAuthor, ['draft', 'archived']),
  }

  // Only a published address is unique, and only within its podcast (log
  // 0039, 27f): the administration's preview names the episode by its id, a
  // reader gets the published one, and a draft or an archived episode shows
  // to whoever may see it.
  const podcastEpisode =
    (previewId === null
      ? null
      : await prisma.podcastEpisode.findFirst({
          select,
          where: { ...visibleWhere, id: previewId, slug: episodeSlug },
        })) ??
    (await prisma.podcastEpisode.findFirst({
      select,
      where: {
        podcast: podcastWhere,
        publishedSlug: episodeSlug,
        state: 'published',
      },
    })) ??
    (await prisma.podcastEpisode.findFirst({
      orderBy: { updatedAt: 'desc' },
      select,
      where: { ...visibleWhere, slug: episodeSlug },
    }))

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
