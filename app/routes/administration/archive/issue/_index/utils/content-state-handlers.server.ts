import { clearSubmissionOnStateChange } from '~/utils/content-state/clear-submission-on-state-change'
import {
  clearReviewsOnDraft,
  createContentStateHandlers,
} from '~/utils/content-state/create-content-state-handlers.server'
import { prisma } from '~/utils/db.server'
import { buildFreeHoldWhere } from '~/utils/edit-hold/build-free-hold-where'
import { buildNotHeldByOthersWhere } from '~/utils/edit-hold/build-not-held-by-others-where'
import { createEditHeldRefusal } from '~/utils/edit-hold/create-edit-held-refusal.server'
import { refuseWhenHeld } from '~/utils/edit-hold/refuse-when-held.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'
import { deletePdfObject } from '~/utils/pdf-store/store-pdf.server'

import { findIssueHeldRefusal } from './find-issue-held-refusal.server'
import { loadMissingIssueContent } from './load-missing-issue-content.server'

const RELEASED_HOLD = {
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
}

/**
 * Issue state-transition handlers: single author, cover image and PDF cleanup
 * on delete, and a publish only of a complete issue (design 26e). None of them
 * runs while someone else edits the issue (decision 0019), and a delete waits
 * for one's own other tab too (0036).
 */
export const issueContentStateHandlers = createContentStateHandlers({
  applyState: async (id, data, authorId) => {
    await refuseWhenHeld(
      () =>
        prisma.issue.update({
          data: {
            ...clearSubmissionOnStateChange(clearReviewsOnDraft(data)),
            // Published and archived content is never held (07g): one's own
            // hold ends with the draft.
            ...(data.state === 'published' || data.state === 'archived'
              ? RELEASED_HOLD
              : {}),
          },
          select: { id: true },
          where: { AND: [buildNotHeldByOthersWhere(authorId, new Date())], id },
        }),
      () => findIssueHeldRefusal(id, authorId),
    )
  },
  approverPublishesWithoutReview: true,

  deleteRow: async (id, context) => {
    // Capture the cover and PDF store ids before the rows are cascade-deleted.
    const issue = await prisma.issue.findUnique({
      select: {
        cover: { select: { id: true } },
        pdf: { select: { id: true } },
      },
      where: { id },
    })

    // Delete the row and its cover files (delete-after-DB, handled inside).
    await deleteRowWithImages(
      async () => (issue?.cover ? [issue.cover.id] : []),
      () =>
        refuseWhenHeld(
          () =>
            // Not while any editor holds it, one's own in another tab too
            // (decision 0036).
            prisma.issue.delete({
              where: { AND: [buildFreeHoldWhere(new Date())], id },
            }),
          () =>
            findIssueHeldRefusal(id, context.authorId, {
              countsOwnOtherTab: true,
            }),
        ),
    )

    // Remove the PDF object too, after the DB delete is durable. Best-effort:
    // the row is already gone, so a store-delete failure must not turn a durable
    // delete into a request failure (it would only leave an orphaned object).
    if (issue?.pdf) {
      await deletePdfObject(issue.pdf.id).catch(() => {})
    }
  },

  ensureApprovingReview: async (id, reviewerId) => {
    const existingReview = await prisma.review.findFirst({
      where: { issueId: id, reviewerId },
    })

    // Nothing to write, but approving still waits for someone else's edit.
    if (existingReview) {
      const refusal = await findIssueHeldRefusal(id, reviewerId)

      if (refusal !== null) throw createEditHeldRefusal(refusal)
    } else {
      // Through the issue, so the approval repeats its hold condition.
      await refuseWhenHeld(
        () =>
          prisma.issue.update({
            data: {
              reviews: { create: { reviewerId, state: 'approved' } },
            },
            select: { id: true },
            where: {
              AND: [buildNotHeldByOthersWhere(reviewerId, new Date())],
              id,
            },
          }),
        () => findIssueHeldRefusal(id, reviewerId),
      )
    }
  },
  entity: 'issue',

  getMissingBeforePublish: loadMissingIssueContent,

  loadPublishState: async (id) => {
    const issue = await prisma.issue.findUniqueOrThrow({
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
      authors: [issue.author],
      publishedAt: issue.publishedAt,
      reviews: issue.reviews,
      submittedAt: issue.submittedAt,
    }
  },
})
