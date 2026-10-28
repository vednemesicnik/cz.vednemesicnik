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
import { getEditHeldRefusal } from '~/utils/edit-hold/get-edit-held-refusal'
import { refuseWhenHeld } from '~/utils/edit-hold/refuse-when-held.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'
import { isUniqueConstraintError } from '~/utils/is-unique-constraint-error.server'

import { getMissingPodcastContent } from '../../../utils/get-missing-podcast-content'
import { loadMissingPodcastContent } from '../../../utils/load-missing-podcast-content.server'
import { findPodcastHeldRefusal } from './find-podcast-held-refusal.server'

const RELEASED_HOLD = {
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
}

/**
 * Podcast state-transition handlers: single author, cover image cleanup on
 * delete, which takes the podcast's empty episode drafts along, a publish only
 * of a complete podcast (27i), and an address unique only once published (log
 * 0039). None of them runs while someone else edits the podcast (log 0019),
 * and a delete waits for one's own other tab too (0036).
 */
export const podcastContentStateHandlers = createContentStateHandlers({
  applyState: async (id, data, authorId) => {
    const podcastData = {
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
      // Retract, archive and restore keep the address it holds.
      await refuseWhenHeld(
        () =>
          prisma.podcast.update({
            data: podcastData,
            select: { id: true },
            where: notHeldWhere,
          }),
        () => findPodcastHeldRefusal(id, authorId),
      )
      return
    }

    // The podcast takes its typed address as the one it holds; an address
    // another podcast took since the check before it blocks the publish as
    // missing content.
    try {
      await refuseWhenHeld(
        () =>
          prisma.$transaction(async (transaction) => {
            const podcast = await transaction.podcast.findUniqueOrThrow({
              select: {
                cover: { select: { id: true } },
                description: true,
                slug: true,
                title: true,
              },
              where: { id },
            })
            const { cover, slug, ...texts } = podcast

            // Incomplete since the check before it: nothing is written (27i).
            const missing = getMissingPodcastContent({
              ...texts,
              hasCover: cover !== null,
              isSlugTaken: false,
              slug,
            })

            if (missing.length > 0) throw createMissingContentError(missing)

            await transaction.podcast.update({
              data: { ...podcastData, publishedSlug: slug },
              select: { id: true },
              where: notHeldWhere,
            })
          }),
        () => findPodcastHeldRefusal(id, authorId),
      )
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error

      const items = await loadMissingPodcastContent(id)

      throw createMissingContentError(
        items.length === 0 ? [TAKEN_SLUG_ITEM] : items,
      )
    }
  },
  approverPublishesWithoutReview: true,

  deleteRow: async (id, context) => {
    await deleteRowWithImages(
      async () => {
        const podcast = await prisma.podcast.findUnique({
          select: { cover: { select: { id: true } } },
          where: { id },
        })
        return podcast?.cover ? [podcast.cover.id] : []
      },
      () =>
        refuseWhenHeld(
          () =>
            prisma.$transaction(async (transaction) => {
              const now = new Date()
              const emptyDraftWhere = {
                firstContentAt: null,
                podcastId: id,
                state: 'draft' as const,
              }

              // An empty episode draft is nothing to keep, and it would block
              // the delete (log 0020).
              await transaction.podcastEpisode.deleteMany({
                where: { ...emptyDraftWhere, AND: [buildFreeHoldWhere(now)] },
              })

              // One an editor holds right now stays, and the delete waits for
              // it, one's own other tab included (log 0036). The refusal names
              // the episode's editor, not the podcast's.
              const heldDraft = await transaction.podcastEpisode.findFirst({
                select: {
                  heldByAuthor: { select: { name: true } },
                  heldByAuthorId: true,
                  heldByTabId: true,
                  heldSince: true,
                  heldUntil: true,
                },
                where: emptyDraftWhere,
              })
              const refusal =
                heldDraft === null
                  ? null
                  : getEditHeldRefusal(heldDraft, {
                      authorId: context.authorId,
                      countsOwnOtherTab: true,
                      now,
                    })

              if (refusal !== null) {
                throw createEditHeldRefusal({ ...refusal, content: 'episode' })
              }

              // Not while any editor holds the podcast itself, one's own in
              // another tab too (log 0036).
              await transaction.podcast.delete({
                where: { AND: [buildFreeHoldWhere(now)], id },
              })
            }),
          () =>
            findPodcastHeldRefusal(id, context.authorId, {
              countsOwnOtherTab: true,
            }),
        ),
    )
  },

  ensureApprovingReview: async (id, reviewerId) => {
    const existingReview = await prisma.review.findFirst({
      where: { podcastId: id, reviewerId },
    })

    // Nothing to write, but approving still waits for someone else's edit.
    if (existingReview) {
      const refusal = await findPodcastHeldRefusal(id, reviewerId)

      if (refusal !== null) throw createEditHeldRefusal(refusal)
    } else {
      // Through the podcast, so the approval repeats its hold condition.
      await refuseWhenHeld(
        () =>
          prisma.podcast.update({
            data: {
              reviews: { create: { reviewerId, state: 'approved' } },
            },
            select: { id: true },
            where: {
              AND: [buildNotHeldByOthersWhere(reviewerId, new Date())],
              id,
            },
          }),
        () => findPodcastHeldRefusal(id, reviewerId),
      )
    }
  },
  entity: 'podcast',

  // What is missing and the taken address block the approval too (27i).
  getMissingBeforePublish: loadMissingPodcastContent,

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
