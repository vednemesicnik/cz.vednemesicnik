import type { Prisma } from '@generated/prisma/client'

import { parseAdminListFilters } from '~/utils/admin-list-filters'
import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { loadSavedFilters } from '~/utils/load-saved-filters.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getSubmissionState } from '~/utils/permissions/author/submission/get-submission-state'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

// Episode presets are keyed by table, not by podcast: one saved filter is offered
// on every podcast's episode list and applies to whichever list it is opened on,
// because both the apply links and the default-filter redirect keep the current
// pathname. Accepted — the filter values themselves are podcast-independent.
const TABLE_KEY = 'podcast_episodes'

// Non-createdAt sorts append `createdAt desc` as a tie-breaker so rows with
// equal values keep a deterministic order across reloads.
const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.PodcastEpisodeOrderByWithRelationInput[]
> = {
  createdAt: (order) => [{ createdAt: order }],
  title: (order) => [{ title: order }, { createdAt: 'desc' }],
}

export const loader = async ({ params, request, url }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['podcast_episode'],
  })

  const { podcastId } = params

  // Before any query: a bare visit with a default preset never renders this list,
  // it redirects to the preset's own URL.
  await resolveDefaultFilter({
    tableKey: TABLE_KEY,
    url,
    userId: context.userId,
  })

  // Check view permissions for each state
  const draftPerms = context.can({
    action: 'view',
    entity: 'podcast_episode',
    state: 'draft',
  })
  const publishedPerms = context.can({
    action: 'view',
    entity: 'podcast_episode',
    state: 'published',
  })
  const archivedPerms = context.can({
    action: 'view',
    entity: 'podcast_episode',
    state: 'archived',
  })

  const { order, query, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys: SORT_KEYS,
  })

  const filters = parseAdminListFilters(request, TABLE_KEY)

  const permissionWhere = {
    OR: buildViewableStateFilters(
      [
        { rights: draftPerms, state: 'draft' },
        { rights: publishedPerms, state: 'published' },
        { rights: archivedPerms, state: 'archived' },
      ],
      { authorId: context.authorId },
    ),
  }

  // The query matches the title or the slug — public URLs expose the slug.
  // Search, sort and the field filter apply to the nested episodes include, not a
  // top-level findMany. SQLite `contains` is case-insensitive for ASCII only; Czech
  // diacritics match case-sensitively (accepted limitation). The filter is ANDed
  // with the permission clause, so it only ever narrows what the role may view.
  const episodesWhere = {
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
      ...(filters.state === undefined ? [] : [{ state: filters.state }]),
    ],
  }

  const [podcast, savedFilters] = await Promise.all([
    prisma.podcast.findUniqueOrThrow({
      select: {
        episodes: {
          orderBy: ORDER_BY[sort](order),
          select: {
            authorId: true,
            createdAt: true,
            id: true,
            reviews: {
              select: {
                createdAt: true,
                reviewer: { select: { role: { select: { level: true } } } },
              },
            },
            state: true,
            submittedAt: true,
            title: true,
          },
          where: episodesWhere,
        },
        id: true,
        title: true,
      },
      where: { id: podcastId },
    }),
    loadSavedFilters({ tableKey: TABLE_KEY, url, userId: context.userId }),
  ])

  // Compute permissions for each episode
  const episodes = podcast.episodes.map(({ reviews, ...episode }) => {
    return {
      ...episode,
      // A submitted draft is neither deleted nor edited by its author (07d).
      canDelete:
        context.can({
          action: 'delete',
          entity: 'podcast_episode',
          state: episode.state,
          targetAuthorIds: [episode.authorId],
        }).hasPermission && episode.submittedAt === null,
      canEdit:
        context.can({
          action: 'update',
          entity: 'podcast_episode',
          state: episode.state,
          targetAuthorIds: [episode.authorId],
        }).hasPermission &&
        !isLockedBySubmission({
          roleLevel: context.roleLevel,
          submittedAt: episode.submittedAt,
        }),
      canView: context.can({
        action: 'view',
        entity: 'podcast_episode',
        state: episode.state,
        targetAuthorIds: [episode.authorId],
      }).hasPermission,
      // The row's tag says what the detail's does (07a).
      submission: getSubmissionState({ ...episode, reviews })?.state ?? null,
    }
  })

  return {
    ...savedFilters,
    canCreate: context.can({
      action: 'create',
      entity: 'podcast_episode',
      state: 'draft',
      targetAuthorIds: [context.authorId],
    }).hasPermission,
    filters,
    podcast: {
      ...podcast,
      episodes,
    },
    query,
  }
}
