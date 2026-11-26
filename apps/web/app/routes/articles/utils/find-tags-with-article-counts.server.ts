import { WEB_PREVIEW_STATE_SELECT } from '~/utils/content-preview/web-preview-state-select'
import { withWebPreviewState } from '~/utils/content-preview/with-web-preview-state'
import { prisma } from '~/utils/db.server'
import { nameCollator } from '~/utils/name-collator'
import {
  ownByAuthor,
  type WebContentVisibility,
} from '~/utils/permissions/author/get-web-content-visibility.server'
import { buildVisibleArticleWhere } from './build-visible-article-where'

/**
 * Finds the tags a reader can open that hold at least one article they can
 * see, with that article count.
 *
 * @param visibility - The request's web visibility, built for `article` and `article_tag`.
 * @returns Tags ordered by name (Czech collation), each with `articleCount > 0` and its `previewState` (11e).
 */
export const findTagsWithArticleCounts = async (
  visibility: WebContentVisibility,
) => {
  const tags = await prisma.articleTag.findMany({
    select: {
      ...WEB_PREVIEW_STATE_SELECT,
      _count: {
        select: {
          articles: { where: buildVisibleArticleWhere(visibility) },
        },
      },
      id: true,
      name: true,
      slug: true,
    },
    where: visibility.where('article_tag', ownByAuthor),
  })

  return tags
    .map(({ _count, ...tag }) => ({
      ...withWebPreviewState(tag),
      articleCount: _count.articles,
    }))
    .filter((tag) => tag.articleCount > 0)
    .sort((first, second) => nameCollator.compare(first.name, second.name))
}
