import { clearSubmissionOnStateChange } from '~/utils/content-state/clear-submission-on-state-change'
import {
  clearReviewsOnDraft,
  createContentStateHandlers,
} from '~/utils/content-state/create-content-state-handlers.server'
import { createMissingContentError } from '~/utils/content-state/create-missing-content-error'
import { prisma } from '~/utils/db.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'

import { loadUnpublishedPodcastItems } from '../../../utils/load-unpublished-podcast-items.server'

/**
 * Episode state-transition handlers: single author, cover image cleanup on
 * delete, and a publish only in a published podcast (design 27f).
 */
export const episodeContentStateHandlers = createContentStateHandlers({
  allowBackdating: true,
  applyState: async (id, data) => {
    // Not in getMissingBeforePublish: an approval leaves the episode off the
    // web, so it stays allowed (27b). Nothing is written.
    if (data.state === 'published') {
      const unpublishedPodcastItems = await loadUnpublishedPodcastItems(id)

      if (unpublishedPodcastItems.length > 0) {
        throw createMissingContentError(unpublishedPodcastItems)
      }
    }

    await prisma.podcastEpisode.update({
      data: clearSubmissionOnStateChange(clearReviewsOnDraft(data)),
      where: { id },
    })
  },
  approverPublishesWithoutReview: true,

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
        submittedAt: true,
      },
      where: { id },
    })

    return {
      authors: [episode.author],
      publishedAt: episode.publishedAt,
      reviews: episode.reviews,
      submittedAt: episode.submittedAt,
    }
  },
})
