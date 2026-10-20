import type { Prisma } from '@generated/prisma/client'

import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

type Context = Pick<AuthorPermissionContext, 'authorId' | 'can'>

/**
 * The issues the signed-in author may view, as a Prisma condition: every state
 * their role views, scoped to their own issues where its access is `own`.
 *
 * @param context - The author permission context, built with `view` on `issue`.
 * @returns The condition to AND with any filter; `OR: []` matches nothing.
 */
export const buildIssuePermissionWhere = (
  context: Context,
): Prisma.IssueWhereInput => ({
  OR: buildViewableStateFilters(
    (['draft', 'published', 'archived'] as const).map((state) => ({
      rights: context.can({ action: 'view', entity: 'issue', state }),
      state,
    })),
    { authorId: context.authorId },
  ),
})
