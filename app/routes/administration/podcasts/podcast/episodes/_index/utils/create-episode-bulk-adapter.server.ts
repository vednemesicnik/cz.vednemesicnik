import type {
  BulkContentAdapter,
  BulkContentRow,
} from '~/utils/bulk-action/run-bulk-content-action.server'
import { prisma } from '~/utils/db.server'

import { episodeContentStateHandlers } from '../../episode/_index/utils/content-state-handlers.server'
import { getEpisodeRowActions } from '../../utils/get-episode-row-actions'

type EpisodeRow = BulkContentRow & {
  number: number | null
  isPodcastPublished: boolean
}

/**
 * The bulk actions of one podcast's episode table (design 27b): the episode's
 * row actions, which publish nothing while the podcast isn't published (27f),
 * and its edit hold. Only the podcast's own episodes are read, whatever ids
 * the form sends. Publishing goes by number, not by the selection: the highest
 * number gets the dialog's moment and each next one a second earlier (with
 * gbsczekj); one published before keeps its date (fge4es3p).
 *
 * @param podcastId - The podcast whose table the bar belongs to.
 * @returns The adapter for `runBulkContentAction`.
 */
export const createEpisodeBulkAdapter = (
  podcastId: string,
): BulkContentAdapter<EpisodeRow> => ({
  entity: 'podcast_episode',
  getRowActions: (row, flags) =>
    getEpisodeRowActions({
      ...flags,
      isPodcastPublished: row.isPodcastPublished,
      state: row.state,
      submission: flags.submission?.state ?? null,
    }),
  handlers: episodeContentStateHandlers,
  loadRows: async (ids) => {
    const episodes = await prisma.podcastEpisode.findMany({
      select: {
        author: { select: { id: true, role: { select: { level: true } } } },
        heldByAuthorId: true,
        heldByTabId: true,
        heldSince: true,
        heldUntil: true,
        id: true,
        number: true,
        podcast: { select: { state: true } },
        publishedAt: true,
        reviews: {
          select: {
            createdAt: true,
            reviewer: {
              select: { id: true, role: { select: { level: true } } },
            },
          },
        },
        state: true,
        submittedAt: true,
      },
      where: { id: { in: ids }, podcastId },
    })

    return episodes.map(
      ({
        author,
        heldByAuthorId,
        heldByTabId,
        heldSince,
        heldUntil,
        podcast,
        ...episode
      }) => ({
        ...episode,
        authors: [author],
        hold: { heldByAuthorId, heldByTabId, heldSince, heldUntil },
        isPodcastPublished: podcast.state === 'published',
      }),
    )
  },
  publishDate: 'chosen',
  // The highest number first; one without a number last (27h).
  sortRows: (rows) =>
    [...rows].sort(
      (first, second) =>
        (second.number ?? Number.NEGATIVE_INFINITY) -
        (first.number ?? Number.NEGATIVE_INFINITY),
    ),
})
