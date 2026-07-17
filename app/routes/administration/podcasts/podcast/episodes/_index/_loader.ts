import type { Prisma } from '@generated/prisma/client'

import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.PodcastEpisodeOrderByWithRelationInput
> = {
  createdAt: (order) => ({ createdAt: order }),
  title: (order) => ({ title: order }),
}

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['podcast_episode'],
  })

  const { podcastId } = params

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

  const { order, q, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys: SORT_KEYS,
  })

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

  // Search and sort apply to the nested episodes include, not a top-level
  // findMany. SQLite `contains` is case-insensitive for ASCII only; Czech
  // diacritics match case-sensitively (accepted limitation).
  const episodesWhere = {
    AND: [permissionWhere, ...(q === '' ? [] : [{ title: { contains: q } }])],
  }

  const podcast = await prisma.podcast.findUniqueOrThrow({
    select: {
      episodes: {
        orderBy: ORDER_BY[sort](order),
        select: {
          authorId: true,
          createdAt: true,
          id: true,
          state: true,
          title: true,
        },
        where: episodesWhere,
      },
      id: true,
      title: true,
    },
    where: { id: podcastId },
  })

  // Compute permissions for each episode
  const episodes = podcast.episodes.map((episode) => {
    return {
      ...episode,
      canDelete: context.can({
        action: 'delete',
        entity: 'podcast_episode',
        state: episode.state,
        targetAuthorIds: [episode.authorId],
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'podcast_episode',
        state: episode.state,
        targetAuthorIds: [episode.authorId],
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'podcast_episode',
        state: episode.state,
        targetAuthorIds: [episode.authorId],
      }).hasPermission,
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'podcast_episode',
      state: 'draft',
      targetAuthorIds: [context.authorId],
    }).hasPermission,
    podcast: {
      ...podcast,
      episodes,
    },
    q,
  }
}
