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
 * sharing preview at it. The main image stands first in the gallery, in the
 * editor as on the web (yj2t50dd): setting one moves it to the first place in
 * the same change; clearing it leaves the order as it is.
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
      let orderedIds: string[] = []

      if (imageId !== null) {
        const storedImages = await prisma.articleImage.findMany({
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
          select: { id: true },
          where: { articleId },
        })
        const storedIds = storedImages.map(({ id }) => id)
        if (!storedIds.includes(imageId)) throw data(null, { status: 400 })

        orderedIds = [imageId, ...storedIds.filter((id) => id !== imageId)]
      }

      return {
        answer: {},
        articleData: { featuredImageId: imageId },
        writes: [
          ...orderedIds.map((id, position) =>
            prisma.articleImage.update({
              data: { position },
              select: { id: true },
              where: { id },
            }),
          ),
          ...(await buildArticlePageSeoImageWrites({
            featuredImage: imageId,
            slug: article.slug,
          })),
        ],
      }
    },
    tabId,
  })
}
