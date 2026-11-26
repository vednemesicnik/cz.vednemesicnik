import type { Prisma } from '@generated/prisma/client'

import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { NON_EMPTY_PODCAST_WHERE } from '~/utils/podcast/non-empty-podcast-where'

type Context = Pick<AuthorPermissionContext, 'authorId' | 'can'>

/**
 * The podcasts the signed-in author may view, as a Prisma condition: every
 * state their role views, scoped to their own podcasts where its access is
 * `own`. An empty draft is left out (log 0020).
 *
 * @param context - The author permission context, built with `view` on `podcast`.
 * @returns The condition to AND with any filter; `OR: []` matches nothing.
 */
export const buildPodcastPermissionWhere = (
  context: Context,
): Prisma.PodcastWhereInput => ({
  ...NON_EMPTY_PODCAST_WHERE,
  OR: buildViewableStateFilters(
    (['draft', 'published', 'archived'] as const).map((state) => ({
      rights: context.can({ action: 'view', entity: 'podcast', state }),
      state,
    })),
    { authorId: context.authorId },
  ),
})
