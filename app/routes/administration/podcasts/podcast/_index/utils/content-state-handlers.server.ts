import {
  clearReviewsOnDraft,
  createContentStateHandlers,
} from '~/utils/content-state/create-content-state-handlers.server'
import { prisma } from '~/utils/db.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'

/** Podcast state-transition handlers: single author, cover image cleanup on delete. */
export const podcastContentStateHandlers = createContentStateHandlers({
  applyState: async (id, data) => {
    await prisma.podcast.update({
      data: clearReviewsOnDraft(data),
      where: { id },
    })
  },

  deleteRow: async (id) => {
    await deleteRowWithImages(
      async () => {
        const podcast = await prisma.podcast.findUnique({
          select: { cover: { select: { id: true } } },
          where: { id },
        })
        return podcast?.cover ? [podcast.cover.id] : []
      },
      () => prisma.podcast.delete({ where: { id } }),
    )
  },

  ensureApprovingReview: async (id, reviewerId) => {
    const existingReview = await prisma.review.findFirst({
      where: { podcastId: id, reviewerId },
    })

    if (!existingReview) {
      await prisma.review.create({
        data: { podcastId: id, reviewerId, state: 'approved' },
      })
    }
  },
  entity: 'podcast',

  loadPublishState: async (id) => {
    const podcast = await prisma.podcast.findUniqueOrThrow({
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
      authors: [podcast.author],
      publishedAt: podcast.publishedAt,
      reviews: podcast.reviews,
    }
  },
  restore: { clearPublishedAt: true },
})
