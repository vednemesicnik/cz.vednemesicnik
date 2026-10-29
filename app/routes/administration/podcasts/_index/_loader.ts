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
import { getOrderedPage } from '~/utils/get-ordered-page'
import { isPagePastLast } from '~/utils/is-page-past-last'
import { loadSavedFilters } from '~/utils/load-saved-filters.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { parsePinnedRowIds } from '~/utils/pinned-rows/parse-pinned-row-ids'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import { buildEpisodePermissionWhere } from '../podcast/episodes/utils/build-episode-permission-where'
import { buildPodcastPermissionWhere } from '../utils/build-podcast-permission-where'
import { formatPodcastEpisodeLines } from '../utils/format-podcast-episode-lines'
import { getPodcastRow } from '../utils/get-podcast-row.server'
import { PODCAST_ROW_SELECT } from '../utils/podcast-row-select'
import {
  type PodcastEpisodeSummary,
  summarizePodcastEpisodes,
} from '../utils/summarize-podcast-episodes'
import type { Route } from './+types/route'
import { SORT_KEYS } from './sort'

// The bulk cap's size: a selection never outgrows the page (readBulkActionForm).
const PAGE_SIZE = 20

const TABLE_KEY = 'podcasts'

// Every listed podcast has a summary; this only satisfies the map's lookup.
const NO_EPISODES: PodcastEpisodeSummary = {
  approvedCount: 0,
  draftCount: 0,
  latestPublishedAt: null,
  pendingCount: 0,
  publishedCount: 0,
}

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: [
      'view',
      'create',
      'update',
      'delete',
      'publish',
      'retract',
      'archive',
      'restore',
      'review',
    ],
    entities: ['podcast', 'podcast_episode'],
  })

  // A live load of the rows on screen (22f): fresh data for exactly those rows,
  // whatever the order, filters or page now say. A fetcher load, so it never
  // redirects.
  const pinnedIds = parsePinnedRowIds(url, PAGE_SIZE)
  const isPinned = pinnedIds !== undefined

  // Before any query: a bare visit with a default preset never renders this list,
  // it redirects to the preset's own URL.
  if (!isPinned) {
    await resolveDefaultFilter({
      tableKey: TABLE_KEY,
      url,
      userId: context.userId,
    })
  }

  // One order (27a); an old ?sort=title or ?sort=createdAt falls back to it.
  const { page, query } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'latestEpisode',
    sortKeys: SORT_KEYS,
  })

  const filters = parseAdminListFilters(request, TABLE_KEY)

  // An empty draft never shows nor counts (log 0020).
  const permissionWhere = buildPodcastPermissionWhere(context)

  // The query matches the title or the slug — public URLs expose the slug.
  // SQLite `contains` is case-insensitive for ASCII only; Czech diacritics
  // match case-sensitively (accepted limitation). The field filter is ANDed with
  // the permission clause, so it only ever narrows what the role may view.
  const where = {
    AND: [
      permissionWhere,
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

  const [rawPodcasts, savedFilters, queueCounts] = await Promise.all([
    prisma.podcast.findMany({
      orderBy: [{ createdAt: 'desc' }],
      select: { ...PODCAST_ROW_SELECT, createdAt: true },
      // Every match, or the rows on screen for a live load (22f).
      where: isPinned
        ? { AND: [permissionWhere, { id: { in: pinnedIds } }] }
        : where,
    }),
    loadSavedFilters({ tableKey: TABLE_KEY, url, userId: context.userId }),
    // The Stav menu counts work within what the role may view, whatever else
    // is searched or filtered (22d).
    countContentQueues(isContributor, (queue) =>
      prisma.podcast.count({
        where: { AND: [permissionWhere, buildContentQueueWhere(queue)] },
      }),
    ),
  ])

  const totalCount = rawPodcasts.length
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Deleting the last row on the last page revalidates a URL past the end.
  if (isPagePastLast(page, totalPages) && !isPinned) {
    throw redirect(buildLastPageRedirect(url, totalPages))
  }

  const podcastIds = rawPodcasts.map((podcast) => podcast.id)
  const episodePermissionWhere = buildEpisodePermissionWhere(context)

  // The Epizody column for the whole list in one query (27a): every published
  // episode, as the web shows them all, and the drafts the role may view,
  // each marked so the summary counts only those.
  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL

  const episodes = await prisma.podcastEpisode.findMany({
    select: {
      authorId: true,
      podcastId: true,
      publishedAt: true,
      reviews: {
        select: {
          createdAt: true,
          reviewer: { select: { role: { select: { level: true } } } },
        },
      },
      state: true,
      submittedAt: true,
    },
    // The summary counts no archived episode, so none is loaded.
    where: {
      OR: [
        { state: 'published' },
        { AND: [episodePermissionWhere, { state: 'draft' }] },
      ],
      podcastId: { in: podcastIds },
    },
  })

  const summaries = summarizePodcastEpisodes(
    podcastIds,
    episodes.map((episode) => ({
      ...episode,
      isViewable: context.can({
        action: 'view',
        entity: 'podcast_episode',
        state: episode.state,
        targetAuthorIds: [episode.authorId],
      }).hasPermission,
    })),
  )

  const getLatestPublishedTime = (podcastId: string) =>
    summaries.get(podcastId)?.latestPublishedAt?.getTime() ?? -1

  // The latest published episode first; a podcast without one goes last (27a).
  // The whole match is ordered before the page is cut, so page 2 goes on
  // where page 1 ends.
  const { pageIds } = getOrderedPage(
    rawPodcasts,
    (first, second) =>
      getLatestPublishedTime(second.id) - getLatestPublishedTime(first.id) ||
      second.createdAt.getTime() - first.createdAt.getTime(),
    { page, pageSize: PAGE_SIZE },
  )
  const podcastById = new Map(
    rawPodcasts.map((podcast) => [podcast.id, podcast]),
  )
  // A live load keeps the order on screen, so its rows need no page.
  const pagePodcasts = isPinned
    ? rawPodcasts
    : pageIds.flatMap((id) => podcastById.get(id) ?? [])

  // Who holds each listed address as published (log 0039): a draft with an
  // address another podcast holds is skipped by bulk publishing too (27i).
  // Only the Coordinator publishes, so only they need it, as in 26a.
  const holders = isApprover
    ? await prisma.podcast.findMany({
        select: { id: true, publishedSlug: true },
        where: {
          publishedSlug: {
            in: pagePodcasts.flatMap(({ slug }) => (slug === '' ? [] : [slug])),
          },
        },
      })
    : []

  const holderIdBySlug = new Map(
    holders.map(({ id, publishedSlug }) => [publishedSlug, id]),
  )

  const now = new Date()

  const podcasts = pagePodcasts.map((podcast) => {
    const summary = summaries.get(podcast.id) ?? NO_EPISODES

    return {
      ...getPodcastRow(podcast, {
        context,
        isSlugTaken:
          podcast.slug !== '' &&
          (holderIdBySlug.get(podcast.slug) ?? podcast.id) !== podcast.id,
        now,
        publishedEpisodeCount: summary.publishedCount,
      }),
      episodeLines: formatPodcastEpisodeLines({
        isContributor,
        podcastState: podcast.state,
        summary,
      }),
      latestPublishedAt: summary.latestPublishedAt,
    }
  })

  return {
    ...savedFilters,
    // Whose live changes are not someone else's (22f).
    authorId: context.authorId,
    canCreate: context.can({
      action: 'create',
      entity: 'podcast',
      state: 'draft',
      targetAuthorIds: [context.authorId],
    }).hasPermission,
    currentPage: page,
    filters,
    isApprover,
    isContributor,
    pageSize: PAGE_SIZE,
    podcasts,
    query,
    queueCounts,
    totalCount,
    totalPages,
  }
}
