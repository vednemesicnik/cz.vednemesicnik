import type { ContentState } from '@generated/prisma/enums'
import { redirect } from 'react-router'

import {
  CONTRIBUTOR_STATE_FILTER_QUEUES,
  STATE_FILTER_QUEUES,
} from '~/config/content-queue-config'
import {
  buildStaleFilterRedirect,
  parseAdminListFilters,
} from '~/utils/admin-list-filters'
import { parseAdminListParams } from '~/utils/admin-list-params'
import { buildContentQueueWhere } from '~/utils/build-content-queue-where'
import { buildLastPageRedirect } from '~/utils/build-last-page-redirect'
import { countContentQueues } from '~/utils/count-content-queues.server'
import { prisma } from '~/utils/db.server'
import { isPagePastLast } from '~/utils/is-page-past-last'
import { loadSavedFilters } from '~/utils/load-saved-filters.server'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { parsePinnedRowIds } from '~/utils/pinned-rows/parse-pinned-row-ids'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import { buildEpisodePermissionWhere } from '../../episodes/utils/build-episode-permission-where'
import { EPISODE_ROW_SELECT } from '../../episodes/utils/episode-row-select'
import { getEpisodeRow } from '../../episodes/utils/get-episode-row.server'
import { SORT_KEYS } from '../sort'

const PAGE_SIZE = 20

// Episode presets are keyed by table, not by podcast: one saved filter is offered
// on every podcast's page and applies to whichever podcast it is opened on,
// because both the apply links and the default-filter redirect keep the current
// pathname (27b, qv31cp5h).
const TABLE_KEY = 'podcast_episodes'

type Options = {
  request: Request
  url: URL
  context: AuthorPermissionContext
  podcast: { id: string; state: ContentState }
}

/**
 * The episode table on a podcast's page (design 27b): the 22a filter block's
 * state, the episodes by number with their row actions, a page of 20, and
 * this podcast's Stav counts.
 *
 * @param options.context - The author permission context, built with the
 *   state actions on `podcast_episode`.
 * @param options.podcast - The podcast; until it is published, its episodes
 *   are neither submitted nor published (27f).
 * @returns The table's data, with the saved filters; throws the redirect of a
 *   default filter, a stale filter or a page past the last. A live load
 *   (`parsePinnedRowIds`) gets the rows on screen and never redirects.
 */
export const loadEpisodeTable = async ({
  request,
  url,
  context,
  podcast,
}: Options) => {
  // A live load of the rows on screen (22f): fresh data for exactly those
  // rows, whatever the order, filters or page now say. A fetcher load, so it
  // never redirects.
  const pinnedIds = parsePinnedRowIds(url, PAGE_SIZE)
  const isPinned = pinnedIds !== undefined

  // Before any query: a bare visit with a default preset never renders this
  // table, it redirects to the preset's own URL.
  if (!isPinned) {
    await resolveDefaultFilter({
      tableKey: TABLE_KEY,
      url,
      userId: context.userId,
    })
  }

  const { order, page, query } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'number',
    sortKeys: SORT_KEYS,
  })

  const filters = parseAdminListFilters(request, TABLE_KEY)

  const permissionWhere = buildEpisodePermissionWhere(context)

  // The query matches the title or the slug — public URLs expose the slug.
  // SQLite `contains` is case-insensitive for ASCII only; Czech diacritics
  // match case-sensitively (accepted limitation). The filter is ANDed with
  // the permission clause, so it only ever narrows what the role may view.
  const where = {
    AND: [
      permissionWhere,
      { podcastId: podcast.id },
      ...(query === ''
        ? []
        : [
            {
              OR: [
                { title: { contains: query } },
                { slug: { contains: query } },
              ],
            },
          ]),
      ...(filters.state === undefined
        ? []
        : [{ OR: filters.state.map(buildContentQueueWhere) }]),
    ],
  }

  // A Contributor approves nothing: Odeslané instead of Ke schválení and
  // Schválené (22i).
  const isContributor = context.roleName === 'contributor'

  // A state the role's menu does not offer (a Coordinator's link opened by a
  // Contributor) drops, or it would filter unseen.
  const staleFilterRedirect = buildStaleFilterRedirect(url, {
    state: (isContributor
      ? CONTRIBUTOR_STATE_FILTER_QUEUES
      : STATE_FILTER_QUEUES
    ).map((queue) => ({ value: queue })),
  })

  if (staleFilterRedirect !== null && !isPinned) {
    throw redirect(staleFilterRedirect)
  }

  const [rawEpisodes, totalCount, savedFilters, queueCounts, episodeCount] =
    await Promise.all([
      prisma.podcastEpisode.findMany({
        orderBy: [{ number: order }, { createdAt: 'desc' }],
        select: EPISODE_ROW_SELECT,
        // The page of the table, or the rows on screen for a live load (22f),
        // of this podcast only.
        ...(isPinned
          ? {
              where: {
                AND: [
                  permissionWhere,
                  { podcastId: podcast.id },
                  { id: { in: pinnedIds } },
                ],
              },
            }
          : { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, where }),
      }),
      prisma.podcastEpisode.count({ where }),
      loadSavedFilters({ tableKey: TABLE_KEY, url, userId: context.userId }),
      // The Stav menu counts this podcast's work within what the role may
      // view, whatever else is searched or filtered (22d, 27b).
      countContentQueues(isContributor, (queue) =>
        prisma.podcastEpisode.count({
          where: {
            AND: [
              permissionWhere,
              { podcastId: podcast.id },
              buildContentQueueWhere(queue),
            ],
          },
        }),
      ),
      // A podcast without a single episode has no filters to offer (27g).
      prisma.podcastEpisode.count({
        where: { AND: [permissionWhere, { podcastId: podcast.id }] },
      }),
    ])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Deleting the last row on the last page revalidates a URL past the end.
  if (isPagePastLast(page, totalPages) && !isPinned) {
    throw redirect(buildLastPageRedirect(url, totalPages))
  }

  const isPodcastPublished = podcast.state === 'published'
  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL

  // The numbers and addresses other episodes of the podcast hold as published
  // (logs 0039, 0047): a draft with one of them is skipped by bulk publishing
  // too (27h). Only the Coordinator publishes, and nothing on an unpublished
  // podcast (27f), so only then is it needed.
  const holders =
    isApprover && isPodcastPublished
      ? await prisma.podcastEpisode.findMany({
          select: { id: true, publishedNumber: true, publishedSlug: true },
          where: {
            OR: [
              {
                publishedNumber: {
                  in: rawEpisodes.flatMap(({ number }) =>
                    number === null ? [] : [number],
                  ),
                },
              },
              {
                publishedSlug: {
                  in: rawEpisodes.flatMap(({ slug }) =>
                    slug === '' ? [] : [slug],
                  ),
                },
              },
            ],
            podcastId: podcast.id,
          },
        })
      : []
  const now = new Date()

  const episodes = rawEpisodes.map((episode) =>
    getEpisodeRow(episode, {
      context,
      isNumberTaken: holders.some(
        (holder) =>
          holder.id !== episode.id &&
          episode.number !== null &&
          holder.publishedNumber === episode.number,
      ),
      isPodcastPublished,
      isSlugTaken: holders.some(
        (holder) =>
          holder.id !== episode.id &&
          episode.slug !== '' &&
          holder.publishedSlug === episode.slug,
      ),
      now,
    }),
  )

  return {
    ...savedFilters,
    currentPage: page,
    episodes,
    filters,
    hasNoEpisodes: episodeCount === 0,
    isContributor,
    pageSize: PAGE_SIZE,
    query,
    queueCounts,
    totalCount,
    totalPages,
  }
}
