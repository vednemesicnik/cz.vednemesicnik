import {
  clearReviewsOnDraft,
  createContentStateHandlers,
} from '~/utils/content-state/create-content-state-handlers.server'
import { prisma } from '~/utils/db.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'
import { deletePdfObject } from '~/utils/pdf-store/store-pdf.server'

/** Issue state-transition handlers: single author, cover image and PDF cleanup on delete. */
export const issueContentStateHandlers = createContentStateHandlers({
  applyState: async (id, data) => {
    await prisma.issue.update({
      data: clearReviewsOnDraft(data),
      where: { id },
    })
  },

  deleteRow: async (id) => {
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
      () => prisma.issue.delete({ where: { id } }),
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

    if (!existingReview) {
      await prisma.review.create({
        data: { issueId: id, reviewerId, state: 'approved' },
      })
    }
  },
  entity: 'issue',

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
      },
      where: { id },
    })

    return {
      authors: [issue.author],
      publishedAt: issue.publishedAt,
      reviews: issue.reviews,
    }
  },
  restore: { clearPublishedAt: true },
})
