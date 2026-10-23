import { clearSubmissionOnStateChange } from '~/utils/content-state/clear-submission-on-state-change'
import {
  clearReviewsOnDraft,
  createContentStateHandlers,
  type StateTransitionData,
} from '~/utils/content-state/create-content-state-handlers.server'
import { createMissingContentError } from '~/utils/content-state/create-missing-content-error'
import { prisma } from '~/utils/db.server'
import { buildFreeHoldWhere } from '~/utils/edit-hold/build-free-hold-where'
import { buildNotHeldByOthersWhere } from '~/utils/edit-hold/build-not-held-by-others-where'
import { createEditHeldRefusal } from '~/utils/edit-hold/create-edit-held-refusal.server'
import { refuseWhenHeld } from '~/utils/edit-hold/refuse-when-held.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'
import { isUniqueConstraintError } from '~/utils/is-unique-constraint-error.server'
import { getIssuePdfFileName } from '~/utils/issue/get-issue-pdf-file-name'
import { getIssuePublishedNumber } from '~/utils/issue/get-issue-published-number'
import { deletePdfObject } from '~/utils/pdf-store/store-pdf.server'

import { getTakenIssueNumberItem } from '../../../utils/get-taken-issue-number-item'
import { findIssueHeldRefusal } from './find-issue-held-refusal.server'
import { getMissingIssueContent } from './get-missing-issue-content'
import { loadMissingIssueContent } from './load-missing-issue-content.server'

const RELEASED_HOLD = {
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
}

/**
 * Publishes the issue's number (log 0039): in one transaction, the issue takes
 * its typed number as the one it holds, and its PDF is named by it when it has
 * no name yet or the number changed; an older name of the same number stays
 * (log 0030). A number another issue took since the check before it blocks the
 * publish as missing content.
 */
const publishNumber = async (
  id: string,
  issueData: StateTransitionData & Record<string, unknown>,
  notHeldWhere: { AND: object[]; id: string },
  authorId: string,
) => {
  try {
    await refuseWhenHeld(
      () =>
        prisma.$transaction(async (transaction) => {
          const issue = await transaction.issue.findUniqueOrThrow({
            select: {
              cover: { select: { id: true } },
              order: true,
              pdf: { select: { fileName: true } },
              publishedNumber: true,
              supplement: true,
              supplementSlug: true,
              year: true,
            },
            where: { id },
          })
          const { year, order, supplementSlug } = issue

          // Incomplete since the check before it: nothing is written (26e).
          if (
            year === null ||
            order === null ||
            issue.cover === null ||
            issue.pdf === null
          ) {
            throw createMissingContentError(
              getMissingIssueContent({
                hasCover: issue.cover !== null,
                hasPdf: issue.pdf !== null,
                isNumberTaken: false,
                order,
                supplement: issue.supplement,
                year,
              }),
            )
          }

          const number = { order, supplementSlug, year }
          const publishedNumber = getIssuePublishedNumber(number)

          await transaction.issue.update({
            data: { ...issueData, publishedNumber },
            select: { id: true },
            where: notHeldWhere,
          })

          if (
            issue.pdf.fileName === null ||
            issue.publishedNumber !== publishedNumber
          ) {
            await transaction.issuePDF.update({
              data: { fileName: getIssuePdfFileName(number) },
              select: { id: true },
              where: { issueId: id },
            })
          }
        }),
      () => findIssueHeldRefusal(id, authorId),
    )
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error

    // The number, or the PDF name it gives, is another issue's.
    const { year, order, supplement } = await prisma.issue.findUniqueOrThrow({
      select: { order: true, supplement: true, year: true },
      where: { id },
    })
    if (year === null || order === null) throw error

    throw createMissingContentError([
      getTakenIssueNumberItem({ order, supplement, year }),
    ])
  }
}

/**
 * Issue state-transition handlers: single author, cover image and PDF cleanup
 * on delete, and a publish only of a complete issue with a free number
 * (design 26e, log 0039), which names its PDF. None of them
 * runs while someone else edits the issue (log 0019), and a delete waits
 * for one's own other tab too (0036).
 */
export const issueContentStateHandlers = createContentStateHandlers({
  applyState: async (id, data, authorId) => {
    const issueData = {
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

    if (data.state === 'published') {
      await publishNumber(id, issueData, notHeldWhere, authorId)
      return
    }

    await refuseWhenHeld(
      () =>
        prisma.issue.update({
          data: issueData,
          select: { id: true },
          where: notHeldWhere,
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
            // (log 0036).
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
