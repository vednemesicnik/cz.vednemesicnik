import { clearSubmissionOnStateChange } from '~/utils/content-state/clear-submission-on-state-change'
import {
  clearReviewsOnDraft,
  createContentStateHandlers,
} from '~/utils/content-state/create-content-state-handlers.server'
import { prisma } from '~/utils/db.server'
import { buildFreeHoldWhere } from '~/utils/edit-hold/build-free-hold-where'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'

/**
 * Podcast state-transition handlers: single author, cover image cleanup on
 * delete, which takes the podcast's empty episode drafts along.
 */
export const podcastContentStateHandlers = createContentStateHandlers({
  applyState: async (id, data) => {
    await prisma.podcast.update({
      data: clearSubmissionOnStateChange(clearReviewsOnDraft(data)),
      where: { id },
    })
  },
  approverPublishesWithoutReview: true,

  deleteRow: async (id) => {
    await deleteRowWithImages(
      async () => {
        const podcast = await prisma.podcast.findUnique({
          select: { cover: { select: { id: true } } },
          where: { id },
        })
        return podcast?.cover ? [podcast.cover.id] : []
      },
      () =>
        prisma.$transaction(async (transaction) => {
          // An empty episode draft is nothing to keep, and it would block the
          // delete (log 0020); one an editor holds right now stays, and so
          // the delete fails as with any episode.
          await transaction.podcastEpisode.deleteMany({
            where: {
              AND: [buildFreeHoldWhere(new Date())],
              firstContentAt: null,
              podcastId: id,
              state: 'draft',
            },
          })

          await transaction.podcast.delete({ where: { id } })
        }),
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
        submittedAt: true,
      },
      where: { id },
    })

    return {
      authors: [podcast.author],
      publishedAt: podcast.publishedAt,
      reviews: podcast.reviews,
      submittedAt: podcast.submittedAt,
    }
  },
})
