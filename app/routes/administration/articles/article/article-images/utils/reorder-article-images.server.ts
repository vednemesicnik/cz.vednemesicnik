import { data } from 'react-router'

import { prisma } from '~/utils/db.server'

import { saveArticleImageChange } from './save-article-image-change.server'

type Options = {
  articleId: string
  tabId: string
  /** The gallery's stored images in their new order. */
  imageIds: string[]
}

/**
 * Saves the gallery's order at once, which is the order on the web (design
 * 24b). An image the list leaves out (one that landed after the editor sent
 * it) keeps its place after the listed ones.
 *
 * @param request - The action's request.
 * @param options - The article, the tab and the image ids in order.
 * @returns `saved` or `not-held`.
 * @throws A 400 response for a repeated id or one that is not the article's.
 */
export async function reorderArticleImages(
  request: Request,
  { articleId, tabId, imageIds }: Options,
) {
  return saveArticleImageChange(request, {
    articleId,
    prepare: async () => {
      const storedImages = await prisma.articleImage.findMany({
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: { id: true },
        where: { articleId },
      })
      const storedIds = storedImages.map(({ id }) => id)

      if (
        new Set(imageIds).size !== imageIds.length ||
        imageIds.some((id) => !storedIds.includes(id))
      ) {
        throw data(null, { status: 400 })
      }

      const orderedIds = [
        ...imageIds,
        ...storedIds.filter((id) => !imageIds.includes(id)),
      ]

      return {
        answer: {},
        writes: orderedIds.map((id, position) =>
          prisma.articleImage.update({
            data: { position },
            select: { id: true },
            where: { id },
          }),
        ),
      }
    },
    tabId,
  })
}
