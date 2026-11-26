import { data } from 'react-router'

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
 * it. Files go only after the row is deleted.
 *
 * @param request - The action's request.
 * @param options - The article, the tab and the image.
 * @returns `saved` or `not-held`.
 * @throws A 400 response for an image of another article; one that does not
 *   exist counts as removed.
 */
export async function removeArticleImage(
  request: Request,
  { articleId, tabId, imageId }: Options,
) {
  return saveArticleImageChange(request, {
    articleId,
    prepare: async () => {
      const image = await prisma.articleImage.findUnique({
        select: { articleId: true },
        where: { id: imageId },
      })

      // Already gone, or never landed (an upload that got no answer): the
      // removal holds.
      if (image === null) return { answer: {}, writes: [] }

      if (image.articleId !== articleId) {
        throw data(null, { status: 400 })
      }

      // The row's `featuredImageId` is set to null by the relation.
      return {
        answer: {},
        onCommitted: () => deleteImage(imageId),
        writes: [
          prisma.articleImage.delete({
            select: { id: true },
            where: { id: imageId },
          }),
        ],
      }
    },
    tabId,
  })
}
