import { data, href } from 'react-router'
import { getListPreview } from '~/utils/content-preview/get-list-preview'
import { getWebPreviewState } from '~/utils/content-preview/get-web-preview-state'
import type { PagePreview } from '~/utils/content-preview/page-preview'
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
      ...WEB_PREVIEW_STATE_SELECT,
      // The line under the headline counts only published episodes (13b),
      // whatever else a signed-in author sees in the list.
      _count: {
        select: { episodes: { where: { state: 'published' } } },
      },
      cover: {
        select: imageSourceSelect,
      },
      description: true,
      episodes: {
        // By number, the newest first: the number is how listeners know an
        // episode (27b).
        orderBy: [{ number: 'desc' }],
        select: {
          ...WEB_PREVIEW_STATE_SELECT,
          description: true,
          id: true,
          number: true,
          publishedAt: true,
          // The typed address: a signed-in author sees drafts here too, and a
          // published episode's is the one it holds (log 0039).
          slug: true,
          title: true,
        },
        // An empty draft never shows, not even as a preview (log 0020).
        where: {
          AND: [
            visibility.where('podcast_episode', ownByAuthor, [
              'draft',
              'archived',
            ]),
          ],
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

  const { _count, cover, reviews, state, submittedAt, ...rest } = podcast
  const previewState = getWebPreviewState({ reviews, state, submittedAt })

  const episodes = rest.episodes.map(
    ({ reviews, state, submittedAt, ...episode }) => ({
      ...episode,
      previewState: getWebPreviewState({ reviews, state, submittedAt }),
      publishedAt: createFormattedDate(episode.publishedAt),
    }),
  )

  // An unpublished podcast is the preview itself; a published one marks its
  // unpublished episodes (10d).
  const preview: PagePreview | null =
    previewState === null
      ? getListPreview(episodes)
      : {
          administrationPath: href('/administration/podcasts/:podcastId', {
            podcastId: podcast.id,
          }),
          entity: 'podcast',
          kind: 'item',
        }

  return {
    podcast: {
      ...rest,
      // No cover, no alt text: the page then shows none (0q3rezo1).
      cover:
        cover === null
          ? null
          : {
              altText: cover.altText,
              sources: createImageSources('podcast-cover', cover),
            },
      episodes,
      previewState,
      publishedEpisodeCount: _count.episodes,
    },
    preview,
  }
}
