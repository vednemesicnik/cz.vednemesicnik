import type { ContentState } from '@generated/prisma/enums'

import {
  ownArticle,
  type WebContentVisibility,
} from '~/utils/permissions/author/get-web-content-visibility.server'

/**
 * The articles the public web may show to this request, as a Prisma `where`:
 * published ones, plus the drafts the signed-in author previews. A draft
 * without an address — an empty one included (decision 0020) — has no page,
 * so it is never listed.
 *
 * @param visibility - What the web may show to this request.
 * @param previewStates - The unpublished states a signed-in author previews; drafts by default.
 * @returns The clause to spread into a `where`.
 */
export const buildVisibleArticleWhere = (
  visibility: WebContentVisibility,
  previewStates?: ContentState[],
) => ({
  ...visibility.where('article', ownArticle, previewStates),
  slug: { not: null },
})
