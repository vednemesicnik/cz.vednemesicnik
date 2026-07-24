import {
  clearReviewsOnDraft,
  createContentStateHandlers,
} from '~/utils/content-state/create-content-state-handlers.server'
import { prisma } from '~/utils/db.server'

/** Category state-transition handlers: single author, no PageSEO, publish date is now. */
export const categoryContentStateHandlers = createContentStateHandlers({
  applyState: async (id, data) => {
    await prisma.articleCategory.update({
      data: clearReviewsOnDraft(data),
      where: { id },
    })
  },

  deleteRow: async (id) => {
    await prisma.articleCategory.delete({ where: { id } })
  },

  ensureApprovingReview: async (id, reviewerId) => {
    const existingReview = await prisma.review.findFirst({
      where: { articleCategoryId: id, reviewerId },
    })

    if (!existingReview) {
      await prisma.review.create({
        data: { articleCategoryId: id, reviewerId, state: 'approved' },
      })
    }
  },
  entity: 'article_category',

  loadPublishState: async (id) => {
    const category = await prisma.articleCategory.findUniqueOrThrow({
      select: {
        author: { select: { role: { select: { level: true } } } },
        publishedAt: true,
        reviews: {
          select: {
            reviewer: { select: { role: { select: { level: true } } } },
          },
        },
      },
      where: { id },
    })

    return {
      authors: [category.author],
      publishedAt: category.publishedAt,
      reviews: category.reviews,
    }
  },
})
