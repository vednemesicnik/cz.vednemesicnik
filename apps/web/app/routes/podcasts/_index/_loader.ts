import { findDraftsFirstPage } from '~/utils/content-preview/find-drafts-first-page'
import { getListPreview } from '~/utils/content-preview/get-list-preview'
import { getWebPreviewState } from '~/utils/content-preview/get-web-preview-state'
import { takeDraftsFirst } from '~/utils/content-preview/take-drafts-first'
import { WEB_PREVIEW_STATE_SELECT } from '~/utils/content-preview/web-preview-state-select'
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
import { resolveEpisodeCover } from '~/utils/podcast-episode/resolve-episode-cover'

import type { Route } from './+types/route'

const LATEST_EPISODE_COUNT = 10

const episodeSelect = {
  ...WEB_PREVIEW_STATE_SELECT,
  cover: {
    select: imageSourceSelect,
  },
  id: true,
  number: true,
  podcast: {
    select: {
      ...WEB_PREVIEW_STATE_SELECT,
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
} as const

export const loader = async ({ request }: Route.LoaderArgs) => {
  const visibility = await getWebContentVisibility(request, [
    'podcast',
    'podcast_episode',
  ])

  // An empty draft never shows, not even as a preview (log 0020).
  const podcastWhere = {
    AND: [visibility.where('podcast', ownByAuthor, ['draft', 'archived'])],
    ...NON_EMPTY_PODCAST_WHERE,
  }

  const podcastsPromise = prisma.podcast.findMany({
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    select: {
      ...WEB_PREVIEW_STATE_SELECT,
      cover: {
        select: imageSourceSelect,
      },
      id: true,
      // The typed address: a signed-in author sees drafts here too, and a
      // published podcast's is the one it holds (log 0039).
      slug: true,
      title: true,
      updatedAt: true,
    },
    where: podcastWhere,
  })

  // Only episodes of a podcast listed here: the episode page 404s otherwise (27f).
  const episodeWhere = {
    AND: [
      visibility.where('podcast_episode', ownByAuthor, ['draft', 'archived']),
      { podcast: podcastWhere },
    ],
    // An empty draft never shows, not even as a preview (log 0020).
    ...NON_EMPTY_EPISODE_WHERE,
  }
  const draftEpisodeWhere = { AND: [episodeWhere, { state: 'draft' as const }] }
  const restEpisodeWhere = {
    AND: [episodeWhere, { state: { not: 'draft' as const } }],
  }

  // A draft stands on top as if published now, the newest save first (10d).
  const episodesPromise = findDraftsFirstPage({
    countDrafts: () =>
      prisma.podcastEpisode.count({ where: draftEpisodeWhere }),
    findDrafts: (window) =>
      prisma.podcastEpisode.findMany({
        ...window,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        select: episodeSelect,
        where: draftEpisodeWhere,
      }),
    findRest: (window) =>
      prisma.podcastEpisode.findMany({
        ...window,
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        select: episodeSelect,
        where: restEpisodeWhere,
      }),
    skip: 0,
    take: LATEST_EPISODE_COUNT,
    withDrafts: visibility.previewMode === 'staff',
  })

  const [podcasts, episodes] = await Promise.all([
    podcastsPromise,
    episodesPromise,
  ])

  const draftPodcasts = podcasts
    .filter((podcast) => podcast.state === 'draft')
    .sort(
      (first, second) => second.updatedAt.getTime() - first.updatedAt.getTime(),
    )
  const restPodcasts = podcasts.filter((podcast) => podcast.state !== 'draft')

  const episodeItems = episodes.map(
    ({ cover, podcast, reviews, state, submittedAt, ...episode }) => {
      const previewState = getWebPreviewState({ reviews, state, submittedAt })

      return {
        ...episode,
        // The episode's own cover, otherwise the podcast's (13a).
        cover: resolveEpisodeCover({ cover, podcastCover: podcast.cover }),
        // A published episode under an unpublished podcast is hidden from the
        // reader too: outlined, with its own date and no tag of its own (10d).
        isPreview:
          previewState !== null || getWebPreviewState(podcast) !== null,
        podcast: { id: podcast.id, slug: podcast.slug, title: podcast.title },
        previewState,
        publishedAt: createFormattedDate(episode.publishedAt),
      }
    },
  )

  const podcastItems = takeDraftsFirst(
    draftPodcasts,
    restPodcasts,
    podcasts.length,
  ).map(({ cover, id, reviews, slug, state, submittedAt, title }) => ({
    // No cover, no alt text: the tile then stays empty.
    cover:
      cover === null
        ? null
        : {
            altText: cover.altText,
            sources: createImageSources('podcast-cover', cover),
          },
    id,
    previewState: getWebPreviewState({ reviews, state, submittedAt }),
    slug,
    title,
  }))

  return {
    episodes: episodeItems,
    podcasts: podcastItems,
    preview: getListPreview(podcastItems) ?? getListPreview(episodeItems),
  }
}
