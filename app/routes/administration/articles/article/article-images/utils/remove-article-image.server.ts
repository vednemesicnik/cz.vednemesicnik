import { data } from 'react-router'

import { buildArticlePageSeoImageWrites } from '~/routes/administration/articles/utils/build-article-page-seo-image-writes.server'
import { prisma } from '~/utils/db.server'
import { deleteImage } from '~/utils/image-store/store-image.server'

import { saveArticleImageChange } from './save-article-image-change.server'

type Options = {
  articleId: string
  tabId: string
  imageId: string
}

/**
 * Removes one image of the gallery at once, with its alt text, caption and
 * files (design 24b); the editor asks first. The main image falls to none with
 * it, and so does the sharing preview. Files go only after the row is deleted.
 *
 * @param request - The action's request.
 * @param options - The article, the tab and the image.
 * @returns `saved` or `not-held`.
 * @throws A 400 response for an image that is not the article's.
 */
export async function removeArticleImage(
  request: Request,
  { articleId, tabId, imageId }: Options,
) {
  return saveArticleImageChange(request, {
    articleId,
    prepare: async (_context, article) => {
      const image = await prisma.articleImage.findFirst({
        select: { id: true },
        where: { articleId, id: imageId },
      })

      if (image === null) {
        throw data(null, { status: 400 })
      }

      // The row's `featuredImageId` is set to null by the relation.
      const seoWrites =
        article.featuredImageId === imageId
          ? await buildArticlePageSeoImageWrites({
              featuredImage: null,
              slug: article.slug,
            })
          : []

      return {
        answer: {},
        onCommitted: () => deleteImage(imageId),
        writes: [
          prisma.articleImage.delete({
            select: { id: true },
            where: { id: imageId },
          }),
          ...seoWrites,
        ],
      }
    },
    tabId,
  })
}
