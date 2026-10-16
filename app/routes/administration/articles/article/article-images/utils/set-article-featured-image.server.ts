import { data } from 'react-router'

import { buildArticlePageSeoImageWrites } from '~/routes/administration/articles/utils/build-article-page-seo-image-writes.server'
import { prisma } from '~/utils/db.server'

import { saveArticleImageChange } from './save-article-image-change.server'

type Options = {
  articleId: string
  tabId: string
  /** The new main image, or `null` for none, which is also a choice (24b). */
  imageId: string | null
}

/**
 * Sets or clears the article's main image at once (design 24b), and points the
 * sharing preview at it.
 *
 * @param request - The action's request.
 * @param options - The article, the tab and the main image or `null`.
 * @returns `saved` or `not-held`.
 * @throws A 400 response for an image that is not the article's.
 */
export async function setArticleFeaturedImage(
  request: Request,
  { articleId, tabId, imageId }: Options,
) {
  return saveArticleImageChange(request, {
    articleId,
    prepare: async (_context, article) => {
      if (
        imageId !== null &&
        (await prisma.articleImage.count({
          where: { articleId, id: imageId },
        })) === 0
      ) {
        throw data(null, { status: 400 })
      }

      return {
        answer: {},
        articleData: { featuredImageId: imageId },
        writes: await buildArticlePageSeoImageWrites({
          featuredImage: imageId,
          slug: article.slug,
        }),
      }
    },
    tabId,
  })
}
