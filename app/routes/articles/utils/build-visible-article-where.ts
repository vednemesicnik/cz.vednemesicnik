import type { ContentState } from '@generated/prisma/enums'

import {
  ownArticle,
  type WebContentVisibility,
} from '~/utils/permissions/author/get-web-content-visibility.server'

/**
 * The articles the public web may show to this request, as a Prisma `where`:
 * published ones, plus the drafts and archived ones the signed-in author
 * previews (10d). A draft
 * without an address — an empty one included (log 0020) — has no page,
 * so it is never listed.
 *
 * @param visibility - What the web may show to this request.
 * @param previewStates - The unpublished states a signed-in author previews; drafts and archived by default.
 * @returns The clause to spread into a `where`.
 */
export const buildVisibleArticleWhere = (
  visibility: WebContentVisibility,
  previewStates: ContentState[] = ['draft', 'archived'],
) => ({
  ...visibility.where('article', ownArticle, previewStates),
  slug: { not: null },
})
