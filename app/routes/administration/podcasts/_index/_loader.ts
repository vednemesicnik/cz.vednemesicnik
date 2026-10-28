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
import { countContentQueues } from '~/utils/count-content-queues.server'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { loadSavedFilters } from '~/utils/load-saved-filters.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { getPodcastDisplayTitle } from '~/utils/podcast/get-podcast-display-title'
import { NON_EMPTY_EPISODE_WHERE } from '~/utils/podcast-episode/non-empty-episode-where'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import { buildEpisodePermissionWhere } from '../podcast/episodes/utils/build-episode-permission-where'
import { buildPodcastPermissionWhere } from '../utils/build-podcast-permission-where'
import { formatPodcastEpisodeLines } from '../utils/format-podcast-episode-lines'
import { getPodcastActions } from '../utils/get-podcast-actions'
import { getPodcastFactLine } from '../utils/get-podcast-fact-line'
import {
  type PodcastEpisodeSummary,
  summarizePodcastEpisodes,
} from '../utils/summarize-podcast-episodes'
import type { Route } from './+types/route'
import { SORT_KEYS } from './sort'

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

  // Before any query: a bare visit with a default preset never renders this list,
  // it redirects to the preset's own URL.
  await resolveDefaultFilter({
    tableKey: TABLE_KEY,
    url,
    userId: context.userId,
  })

  // One order (27a); an old ?sort=title or ?sort=createdAt falls back to it.
  const { query } = parseAdminListParams(request, {
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

  if (staleFilterRedirect !== null) {
    throw redirect(staleFilterRedirect)
  }

  const [rawPodcasts, savedFilters, queueCounts] = await Promise.all([
    prisma.podcast.findMany({
      orderBy: [{ createdAt: 'desc' }],
      select: {
        // An empty draft never counts, nor blocks the delete (log 0020).
        _count: { select: { episodes: { where: NON_EMPTY_EPISODE_WHERE } } },
        author: {
          select: { id: true, name: true, role: { select: { level: true } } },
        },
        cover: { select: imageSourceSelect },
        createdAt: true,
        id: true,
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
        submittedBy: { select: { name: true } },
        title: true,
        updatedAt: true,
      },
      where,
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

  const podcastIds = rawPodcasts.map((podcast) => podcast.id)
  const episodePermissionWhere = buildEpisodePermissionWhere(context)

  // The Epizody column for the whole list in one query (27a): every published
  // episode, as the web shows them all, and the drafts the role may view,
  // each marked so the summary counts only those.
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

  const podcasts = rawPodcasts
    .map((podcast) => {
      const flags = getContentActionFlags(context, 'podcast', {
        authors: [podcast.author],
        reviews: podcast.reviews,
        state: podcast.state,
        submittedAt: podcast.submittedAt,
      })
      const summary = summaries.get(podcast.id) ?? NO_EPISODES
      const submission = flags.submission?.state ?? null

      return {
        actions: getPodcastActions({
          ...flags,
          state: podcast.state,
          submission,
        }),
        // Its episodes hold it (27f), so the bar, which only deletes until
        // #772, can't take it.
        canSelect: flags.canDelete && podcast._count.episodes === 0,
        cover:
          podcast.cover === null
            ? null
            : createImageSources('podcast-cover', podcast.cover),
        createdAt: podcast.createdAt,
        episodeCount: podcast._count.episodes,
        episodeLines: formatPodcastEpisodeLines({
          isContributor,
          podcastState: podcast.state,
          summary,
        }),
        // The row's tag says what the detail's does (07a), with one fact (27a).
        factLine: getPodcastFactLine({
          authorName: podcast.author.name,
          state: podcast.state,
          submission: flags.submission,
          submittedByName: podcast.submittedBy?.name ?? null,
          updatedAt: podcast.updatedAt,
        }),
        id: podcast.id,
        latestPublishedAt: summary.latestPublishedAt,
        publishedEpisodeCount: summary.publishedCount,
        slug: podcast.slug,
        state: podcast.state,
        submission,
        // A draft saved without a title goes by a name (copy utgh1hb7).
        title: getPodcastDisplayTitle(podcast.title),
      }
    })
    // The latest published episode first; a podcast without one goes last (27a).
    .sort(
      (first, second) =>
        (second.latestPublishedAt?.getTime() ?? -1) -
          (first.latestPublishedAt?.getTime() ?? -1) ||
        second.createdAt.getTime() - first.createdAt.getTime(),
    )

  return {
    ...savedFilters,
    canCreate: context.can({
      action: 'create',
      entity: 'podcast',
      state: 'draft',
      targetAuthorIds: [context.authorId],
    }).hasPermission,
    filters,
    isApprover: context.roleLevel <= APPROVER_ROLE_LEVEL,
    isContributor,
    podcasts,
    query,
    queueCounts,
  }
}
