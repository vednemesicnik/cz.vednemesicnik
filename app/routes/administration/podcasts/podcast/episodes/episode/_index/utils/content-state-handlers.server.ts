import {
  clearReviewsOnDraft,
  createContentStateHandlers,
} from '~/utils/content-state/create-content-state-handlers.server'
import { prisma } from '~/utils/db.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'

/** Episode state-transition handlers: single author, cover image cleanup on delete. */
export const episodeContentStateHandlers = createContentStateHandlers({
  allowBackdating: true,
  applyState: async (id, data) => {
    await prisma.podcastEpisode.update({
      data: clearReviewsOnDraft(data),
      where: { id },
    })
  },

  deleteRow: async (id) => {
    await deleteRowWithImages(
      async () => {
        const episode = await prisma.podcastEpisode.findUnique({
          select: { cover: { select: { id: true } } },
          where: { id },
        })
        return episode?.cover ? [episode.cover.id] : []
      },
      () => prisma.podcastEpisode.delete({ where: { id } }),
    )
  },

  ensureApprovingReview: async (id, reviewerId) => {
    const existingReview = await prisma.review.findFirst({
      where: { podcastEpisodeId: id, reviewerId },
    })

    if (!existingReview) {
      await prisma.review.create({
        data: { podcastEpisodeId: id, reviewerId, state: 'approved' },
      })
    }
  },
  entity: 'podcast_episode',

  loadPublishState: async (id) => {
    const episode = await prisma.podcastEpisode.findUniqueOrThrow({
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
      authors: [episode.author],
      publishedAt: episode.publishedAt,
      reviews: episode.reviews,
    }
  },
})
