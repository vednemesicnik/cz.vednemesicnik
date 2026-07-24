import {
  clearReviewsOnDraft,
  createContentStateHandlers,
} from '~/utils/content-state/create-content-state-handlers.server'
import { prisma } from '~/utils/db.server'

/** Tag state-transition handlers: single author, no PageSEO, publish date is now. */
export const tagContentStateHandlers = createContentStateHandlers({
  applyState: async (id, data) => {
    await prisma.articleTag.update({
      data: clearReviewsOnDraft(data),
      where: { id },
    })
  },

  deleteRow: async (id) => {
    await prisma.articleTag.delete({ where: { id } })
  },

  ensureApprovingReview: async (id, reviewerId) => {
    const existingReview = await prisma.review.findFirst({
      where: { articleTagId: id, reviewerId },
    })

    if (!existingReview) {
      await prisma.review.create({
        data: { articleTagId: id, reviewerId, state: 'approved' },
      })
    }
  },
  entity: 'article_tag',

  loadPublishState: async (id) => {
    const tag = await prisma.articleTag.findUniqueOrThrow({
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
      authors: [tag.author],
      publishedAt: tag.publishedAt,
      reviews: tag.reviews,
    }
  },
  restore: { clearPublishedAt: true },
})
