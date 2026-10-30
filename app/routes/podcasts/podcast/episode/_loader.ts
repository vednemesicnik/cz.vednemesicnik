import type { Prisma } from '@generated/prisma/client'
import { data, href } from 'react-router'

import type { NotFoundEpisodeData } from '~/components/boundary-error'
import { getWebPreviewState } from '~/utils/content-preview/get-web-preview-state'
import { WEB_PREVIEW_STATE_SELECT } from '~/utils/content-preview/web-preview-state-select'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import { imageSourceSelect } from '~/utils/image-store/create-image-sources'
import { getWebContentVisibility } from '~/utils/permissions/author/get-web-content-visibility.server'
import { findWebPodcast } from '~/utils/podcast/find-web-podcast.server'
import { buildWebVisibleEpisodeWhere } from '~/utils/podcast-episode/build-web-visible-episode-where'
import { resolveEpisodeCover } from '~/utils/podcast-episode/resolve-episode-cover'

import type { Route } from './+types/route'

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { podcastSlug, episodeSlug } = params
  const visibility = await getWebContentVisibility(request, [
    'podcast',
    'podcast_episode',
  ])

  const visible = buildWebVisibleEpisodeWhere(visibility)

  const select = {
    ...WEB_PREVIEW_STATE_SELECT,
    cover: {
      select: imageSourceSelect,
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
        ...WEB_PREVIEW_STATE_SELECT,
        cover: {
          select: imageSourceSelect,
        },
        id: true,
        title: true,
      },
    },
    publishedAt: true,
    slug: true,
    title: true,
  } satisfies Prisma.PodcastEpisodeSelect

  const toLoaderData = ({
    cover,
    podcast,
    publishedAt,
    reviews,
    state,
    submittedAt,
    ...episode
  }: Prisma.PodcastEpisodeGetPayload<{ select: typeof select }>) => {
    // A published episode under an unpublished podcast is hidden from the
    // reader too, and says why with the podcast's tag (10d).
    const previewState =
      getWebPreviewState({ reviews, state, submittedAt }) ??
      getWebPreviewState(podcast)

    return {
      podcastEpisode: {
        ...episode,
        // The episode's own cover, otherwise the podcast's (13c).
        cover: resolveEpisodeCover({ cover, podcastCover: podcast.cover }),
        podcast: { id: podcast.id, title: podcast.title },
        previewState,
        publishedAt: createFormattedDate(publishedAt),
      },
      preview:
        previewState === null
          ? null
          : {
              administrationPath: href(
                '/administration/podcasts/:podcastId/episodes/:episodeId',
                { episodeId: episode.id, podcastId: podcast.id },
              ),
              entity: 'podcast_episode' as const,
              kind: 'item' as const,
            },
    }
  }

  const previewId = new URL(request.url).searchParams.get('id')

  // Only a published address is unique, the podcast's and the episode's
  // within it (logs 0039, 0047): the administration's preview names the
  // episode by its id, under the podcast's typed address, which a draft
  // podcast may share with a published one.
  const previewEpisode =
    previewId === null
      ? null
      : await prisma.podcastEpisode.findFirst({
          select,
          where: {
            ...visible.episode,
            id: previewId,
            podcast: { slug: podcastSlug, ...visible.podcast },
            slug: episodeSlug,
          },
        })

  if (previewEpisode !== null) {
    return toLoaderData(previewEpisode)
  }

  // Otherwise the episode is looked up under the podcast the address names
  // for this visitor: a reader gets the published one, and a draft or an
  // archived episode shows to whoever may see it.
  const webPodcast = await findWebPodcast(podcastSlug, visibility)

  if (webPodcast === null) {
    throw data(null, { status: 404 })
  }

  const podcastWhere = { id: webPodcast.id }

  const podcastEpisode =
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
      // An empty draft never shows, not even as a preview (log 0020).
      where: { podcast: podcastWhere, ...visible.episode, slug: episodeSlug },
    }))

  if (podcastEpisode === null) {
    // Design 30f offers `Na podcast` only when the podcast itself can be
    // shown, as it can here: the address found it.
    const notFoundData: NotFoundEpisodeData = {
      podcastHref: href('/podcasts/:podcastSlug', { podcastSlug }),
    }

    throw data(notFoundData, { status: 404 })
  }

  return toLoaderData(podcastEpisode)
}
