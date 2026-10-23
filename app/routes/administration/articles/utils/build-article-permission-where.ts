import type { Prisma } from '@generated/prisma/client'

import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import { NON_EMPTY_ARTICLE_WHERE } from './non-empty-article-where'

type Context = Pick<AuthorPermissionContext, 'authorId' | 'can'>

/**
 * The articles the signed-in author may view, as a Prisma condition: every
 * state their role views, scoped to their own articles where its access is
 * `own`, without empty drafts (log 0020). The article list and a
 * category's or tag's detail count the same set (design 22a, 25b).
 *
 * @param context - The author permission context, built with `view` on `article`.
 * @returns The condition to AND with any filter; `OR: []` matches nothing.
 */
export const buildArticlePermissionWhere = (
  context: Context,
): Prisma.ArticleWhereInput => ({
  ...NON_EMPTY_ARTICLE_WHERE,
  OR: buildViewableStateFilters(
    (['draft', 'published', 'archived'] as const).map((state) => ({
      rights: context.can({ action: 'view', entity: 'article', state }),
      state,
    })),
    { authors: { some: { id: context.authorId } } },
  ),
})
