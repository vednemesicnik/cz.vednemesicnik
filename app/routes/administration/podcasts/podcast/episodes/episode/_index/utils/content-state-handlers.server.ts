import { TAKEN_SLUG_ITEM } from '~/routes/administration/articles/article/_index/utils/slug-items'
import { clearSubmissionOnStateChange } from '~/utils/content-state/clear-submission-on-state-change'
import {
  clearReviewsOnDraft,
  createContentStateHandlers,
} from '~/utils/content-state/create-content-state-handlers.server'
import { createMissingContentError } from '~/utils/content-state/create-missing-content-error'
import { prisma } from '~/utils/db.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'
import { isUniqueConstraintError } from '~/utils/is-unique-constraint-error.server'
import { loadTakenEpisodeSlugItems } from '../../../utils/load-taken-episode-slug-items.server'
import { loadUnpublishedPodcastItems } from '../../../utils/load-unpublished-podcast-items.server'

/**
 * Episode state-transition handlers: single author, cover image cleanup on
 * delete, a publish only in a published podcast (design 27f), and an address
 * unique within the podcast only once published (log 0039).
 */
export const episodeContentStateHandlers = createContentStateHandlers({
  allowBackdating: true,
  applyState: async (id, data) => {
    const episodeData = clearSubmissionOnStateChange(clearReviewsOnDraft(data))

    if (data.state !== 'published') {
      // Retract, archive and restore keep the address the episode holds.
      await prisma.podcastEpisode.update({ data: episodeData, where: { id } })
      return
    }

    // Not in getMissingBeforePublish: an approval leaves the episode off the
    // web, so it stays allowed (27b). Nothing is written.
    const unpublishedPodcastItems = await loadUnpublishedPodcastItems(id)

    if (unpublishedPodcastItems.length > 0) {
      throw createMissingContentError(unpublishedPodcastItems)
    }

    // The episode takes its typed address as the one it holds; an address
    // another episode of the podcast took since the check before it blocks
    // the publish as missing content.
    try {
      await prisma.$transaction(async (transaction) => {
        const { slug } = await transaction.podcastEpisode.findUniqueOrThrow({
          select: { slug: true },
          where: { id },
        })

        await transaction.podcastEpisode.update({
          data: { ...episodeData, publishedSlug: slug },
          where: { id },
        })
      })
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw createMissingContentError([TAKEN_SLUG_ITEM])
      }
      throw error
    }
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

  // A taken address blocks the approval too (24d).
  getMissingBeforePublish: loadTakenEpisodeSlugItems,

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
