import { TAKEN_SLUG_ITEM } from '~/routes/administration/articles/article/_index/utils/slug-items'
import { clearSubmissionOnStateChange } from '~/utils/content-state/clear-submission-on-state-change'
import {
  clearReviewsOnDraft,
  createContentStateHandlers,
} from '~/utils/content-state/create-content-state-handlers.server'
import { createMissingContentError } from '~/utils/content-state/create-missing-content-error'
import { prisma } from '~/utils/db.server'
import { buildFreeHoldWhere } from '~/utils/edit-hold/build-free-hold-where'
import { buildNotHeldByOthersWhere } from '~/utils/edit-hold/build-not-held-by-others-where'
import { createEditHeldRefusal } from '~/utils/edit-hold/create-edit-held-refusal.server'
import { refuseWhenHeld } from '~/utils/edit-hold/refuse-when-held.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'
import { isUniqueConstraintError } from '~/utils/is-unique-constraint-error.server'

import { loadMissingEpisodeContent } from '../../../utils/load-missing-episode-content.server'
import { loadUnpublishedPodcastItems } from '../../../utils/load-unpublished-podcast-items.server'
import { findEpisodeHeldRefusal } from './find-episode-held-refusal.server'

const RELEASED_HOLD = {
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
}

/**
 * Episode state-transition handlers: single author, cover image cleanup on
 * delete, a publish only in a published podcast (design 27f) and of a
 * complete episode (27h), and a number and an address unique within the
 * podcast only once published (logs 0039, 0047). None of them runs while
 * someone else edits the episode (log 0019), and a delete waits for one's own
 * other tab too (0036).
 */
export const episodeContentStateHandlers = createContentStateHandlers({
  allowBackdating: true,
  applyState: async (id, data, authorId) => {
    const episodeData = {
      ...clearSubmissionOnStateChange(clearReviewsOnDraft(data)),
      // Published and archived content is never held (07g): one's own
      // hold ends with the draft.
      ...(data.state === 'published' || data.state === 'archived'
        ? RELEASED_HOLD
        : {}),
    }
    // Not while someone else edits it (log 0019).
    const notHeldWhere = {
      AND: [buildNotHeldByOthersWhere(authorId, new Date())],
      id,
    }

    if (data.state !== 'published') {
      // Retract, archive and restore keep the number and address it holds.
      await refuseWhenHeld(
        () =>
          prisma.podcastEpisode.update({
            data: episodeData,
            select: { id: true },
            where: notHeldWhere,
          }),
        () => findEpisodeHeldRefusal(id, authorId),
      )
      return
    }

    // Not in getMissingBeforePublish: an approval leaves the episode off the
    // web, so it stays allowed (27b). Nothing is written.
    const unpublishedPodcastItems = await loadUnpublishedPodcastItems(id)

    if (unpublishedPodcastItems.length > 0) {
      throw createMissingContentError(unpublishedPodcastItems)
    }

    // The episode takes its typed number and address as the ones it holds; a
    // value another episode of the podcast took since the check before it
    // blocks the publish as missing content.
    try {
      await refuseWhenHeld(
        () =>
          prisma.$transaction(async (transaction) => {
            const { number, slug } =
              await transaction.podcastEpisode.findUniqueOrThrow({
                select: { number: true, slug: true },
                where: { id },
              })

            await transaction.podcastEpisode.update({
              data: {
                ...episodeData,
                publishedNumber: number,
                publishedSlug: slug,
              },
              select: { id: true },
              where: notHeldWhere,
            })
          }),
        () => findEpisodeHeldRefusal(id, authorId),
      )
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error

      const items = await loadMissingEpisodeContent(id)

      throw createMissingContentError(
        items.length === 0 ? [TAKEN_SLUG_ITEM] : items,
      )
    }
  },
  approverPublishesWithoutReview: true,

  deleteRow: async (id, context) => {
    await deleteRowWithImages(
      async () => {
        const episode = await prisma.podcastEpisode.findUnique({
          select: { cover: { select: { id: true } } },
          where: { id },
        })
        return episode?.cover ? [episode.cover.id] : []
      },
      () =>
        refuseWhenHeld(
          () =>
            // Not while any editor holds it, one's own in another tab too
            // (log 0036).
            prisma.podcastEpisode.delete({
              where: { AND: [buildFreeHoldWhere(new Date())], id },
            }),
          () =>
            findEpisodeHeldRefusal(id, context.authorId, {
              countsOwnOtherTab: true,
            }),
        ),
    )
  },

  ensureApprovingReview: async (id, reviewerId) => {
    const existingReview = await prisma.review.findFirst({
      where: { podcastEpisodeId: id, reviewerId },
    })

    // Nothing to write, but approving still waits for someone else's edit.
    if (existingReview) {
      const refusal = await findEpisodeHeldRefusal(id, reviewerId)

      if (refusal !== null) throw createEditHeldRefusal(refusal)
    } else {
      // Through the episode, so the approval repeats its hold condition.
      await refuseWhenHeld(
        () =>
          prisma.podcastEpisode.update({
            data: {
              reviews: { create: { reviewerId, state: 'approved' } },
            },
            select: { id: true },
            where: {
              AND: [buildNotHeldByOthersWhere(reviewerId, new Date())],
              id,
            },
          }),
        () => findEpisodeHeldRefusal(id, reviewerId),
      )
    }
  },
  entity: 'podcast_episode',

  // What is missing, the incomplete links and the taken values block the
  // approval too (27h, 27f).
  getMissingBeforePublish: loadMissingEpisodeContent,

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
