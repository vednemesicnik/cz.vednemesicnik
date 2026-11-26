import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

type Context = Pick<AuthorPermissionContext, 'authorId' | 'can'>

/**
 * The categories or tags the signed-in author may view, as a Prisma condition:
 * every state their role views, scoped to their own where its access is `own`
 * (design 25a, 25e).
 *
 * @param context - The author permission context, built with `view` on
 *   `entity`.
 * @param entity - Categories or tags.
 * @returns The condition to AND with any filter; `OR: []` matches nothing.
 */
export const buildTaxonomyPermissionWhere = (
  context: Context,
  entity: 'article_category' | 'article_tag',
) => ({
  OR: buildViewableStateFilters(
    (['draft', 'published', 'archived'] as const).map((state) => ({
      rights: context.can({ action: 'view', entity, state }),
      state,
    })),
    { authorId: context.authorId },
  ),
})
