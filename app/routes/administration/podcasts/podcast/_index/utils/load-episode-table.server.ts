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
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import { buildEpisodePermissionWhere } from '../../episodes/utils/build-episode-permission-where'
import { getEpisodeFactLine } from '../../episodes/utils/get-episode-fact-line'
import { getEpisodeRowActions } from '../../episodes/utils/get-episode-row-actions'
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
 *   default filter, a stale filter or a page past the last.
 */
export const loadEpisodeTable = async ({
  request,
  url,
  context,
  podcast,
}: Options) => {
  // Before any query: a bare visit with a default preset never renders this
  // table, it redirects to the preset's own URL.
  await resolveDefaultFilter({
    tableKey: TABLE_KEY,
    url,
    userId: context.userId,
  })

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

  if (staleFilterRedirect !== null) {
    throw redirect(staleFilterRedirect)
  }

  const [rawEpisodes, totalCount, savedFilters, queueCounts, episodeCount] =
    await Promise.all([
      prisma.podcastEpisode.findMany({
        orderBy: [{ number: order }, { createdAt: 'desc' }],
        select: {
          author: {
            select: {
              id: true,
              name: true,
              role: { select: { level: true } },
            },
          },
          id: true,
          links: { orderBy: { order: 'asc' }, select: { label: true } },
          number: true,
          publishedAt: true,
          reviews: {
            select: {
              createdAt: true,
              reviewer: {
                select: { id: true, role: { select: { level: true } } },
              },
            },
          },
          slug: true,
          state: true,
          submittedAt: true,
          title: true,
          updatedAt: true,
        },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        where,
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
  if (isPagePastLast(page, totalPages)) {
    throw redirect(buildLastPageRedirect(url, totalPages))
  }

  const isPodcastPublished = podcast.state === 'published'

  const episodes = rawEpisodes.map((episode) => {
    const flags = getContentActionFlags(context, 'podcast_episode', {
      authors: [episode.author],
      reviews: episode.reviews,
      state: episode.state,
      submittedAt: episode.submittedAt,
    })
    const submission = flags.submission?.state ?? null

    return {
      ...getEpisodeRowActions({
        ...flags,
        isPodcastPublished,
        state: episode.state,
        submission,
      }),
      authorName: episode.author.name,
      canDelete: flags.canDelete,
      // The row's tag says what the detail's does (07a), with one fact (27b).
      factLine: getEpisodeFactLine({
        authorName: episode.author.name,
        state: episode.state,
        submission: flags.submission,
        updatedAt: episode.updatedAt,
      }),
      id: episode.id,
      linkLabels: episode.links.map((link) => link.label),
      number: episode.number,
      publishedAt: episode.publishedAt?.toISOString() ?? null,
      slug: episode.slug,
      state: episode.state,
      submission,
      title: episode.title,
    }
  })

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
