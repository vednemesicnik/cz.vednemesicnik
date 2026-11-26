import type { Prisma } from '@generated/prisma/client'

import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { NON_EMPTY_EPISODE_WHERE } from '~/utils/podcast-episode/non-empty-episode-where'

type Context = Pick<AuthorPermissionContext, 'authorId' | 'can'>

/**
 * The episodes the signed-in author may view, as a Prisma condition: every
 * state their role views, scoped to their own episodes where its access is
 * `own`.
 *
 * @param context - The author permission context, built with `view` on `podcast_episode`.
 * @returns The condition to AND with any filter; `OR: []` matches nothing.
 */
export const buildEpisodePermissionWhere = (
  context: Context,
): Prisma.PodcastEpisodeWhereInput => ({
  ...NON_EMPTY_EPISODE_WHERE,
  OR: buildViewableStateFilters(
    (['draft', 'published', 'archived'] as const).map((state) => ({
      rights: context.can({ action: 'view', entity: 'podcast_episode', state }),
      state,
    })),
    { authorId: context.authorId },
  ),
})
