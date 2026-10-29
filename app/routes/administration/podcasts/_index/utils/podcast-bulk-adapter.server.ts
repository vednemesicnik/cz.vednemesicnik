import type {
  BulkContentAdapter,
  BulkContentRow,
} from '~/utils/bulk-action/run-bulk-content-action.server'
import { prisma } from '~/utils/db.server'
import { NON_EMPTY_EPISODE_WHERE } from '~/utils/podcast-episode/non-empty-episode-where'
import { podcastContentStateHandlers } from '../../podcast/_index/utils/content-state-handlers.server'
import { getPodcastActions } from '../../utils/get-podcast-actions'

type PodcastRow = BulkContentRow & {
  episodeCount: number
  publishedEpisodeCount: number
}

/**
 * The podcast list's bulk actions (design 27a): the podcast's actions and its
 * edit hold. A podcast with episodes is never deleted (27f). Publishing takes
 * no date and no order from the dialog, yet `/podcasts` sorts by the publish
 * date, so the top podcast of the list gets the moment of confirmation and
 * each next one a second earlier; one published before keeps its date
 * (fge4es3p).
 */
export const podcastBulkAdapter: BulkContentAdapter<PodcastRow> = {
  entity: 'podcast',
  getRowActions: (row, flags) => ({
    menu: getPodcastActions({
      ...flags,
      state: row.state,
      submission: flags.submission?.state ?? null,
    }).filter((action) => action !== 'delete' || row.episodeCount === 0),
    row: null,
  }),
  handlers: podcastContentStateHandlers,
  // Its published episodes leave the web with it (27a).
  hasPublishedRelated: (row) => row.publishedEpisodeCount > 0,
  loadRows: async (ids) => {
    const podcasts = await prisma.podcast.findMany({
      select: {
        // An empty draft never counts, nor blocks the delete (log 0020).
        _count: { select: { episodes: { where: NON_EMPTY_EPISODE_WHERE } } },
        author: { select: { id: true, role: { select: { level: true } } } },
        episodes: { select: { id: true }, where: { state: 'published' } },
        heldByAuthorId: true,
        heldByTabId: true,
        heldSince: true,
        heldUntil: true,
        id: true,
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
      where: { id: { in: ids } },
    })

    return podcasts.map(
      ({
        _count,
        author,
        episodes,
        heldByAuthorId,
        heldByTabId,
        heldSince,
        heldUntil,
        ...podcast
      }) => ({
        ...podcast,
        authors: [author],
        episodeCount: _count.episodes,
        hold: { heldByAuthorId, heldByTabId, heldSince, heldUntil },
        publishedEpisodeCount: episodes.length,
      }),
    )
  },
  publishDate: 'ordered',
}
