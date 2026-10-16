import { clearSubmissionOnStateChange } from '~/utils/content-state/clear-submission-on-state-change'
import {
  clearReviewsOnDraft,
  createContentStateHandlers,
} from '~/utils/content-state/create-content-state-handlers.server'
import { prisma } from '~/utils/db.server'
import { buildNotHeldByOthersWhere } from '~/utils/edit-hold/build-not-held-by-others-where'
import { createEditHeldRefusal } from '~/utils/edit-hold/create-edit-held-refusal.server'
import { refuseWhenHeld } from '~/utils/edit-hold/refuse-when-held.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'

import { findArticleHeldByName } from './find-article-held-by-name.server'
import { getMissingArticleContent } from './get-missing-article-content'

const buildPathname = (slug: string) => `/articles/${slug}`

const RELEASED_HOLD = {
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
}

/**
 * Article state-transition handlers. The article is the only entity that mirrors
 * every transition onto its standalone PageSEO row, it accepts an approver
 * backdate on publish, the Coordinator publishes it without a prior review, and an
 * incomplete article is not published (design 23h).
 */
export const articleContentStateHandlers = createContentStateHandlers({
  allowBackdating: true,
  applyState: async (id, data, authorId) => {
    const updatedArticle = await refuseWhenHeld(
      () =>
        prisma.article.update({
          data: {
            // Retract/restore also wipe reviews; PageSEO has no reviews to clear.
            ...clearSubmissionOnStateChange(clearReviewsOnDraft(data)),
            // Published and archived content is never held (07g): one's own
            // hold ends with the draft.
            ...(data.state === 'published' || data.state === 'archived'
              ? RELEASED_HOLD
              : {}),
          },
          select: { slug: true },
          // Not while someone else edits it (decision 0019).
          where: { AND: [buildNotHeldByOthersWhere(authorId, new Date())], id },
        }),
      () => findArticleHeldByName(id, authorId),
    )

    // Mirror the same columns onto the standalone PageSEO row keyed by
    // pathname; a draft without an address has none yet.
    if (updatedArticle.slug !== null) {
      await prisma.pageSEO.updateMany({
        data,
        where: { pathname: buildPathname(updatedArticle.slug) },
      })
    }
  },
  approverPublishesWithoutReview: true,

  deleteRow: async (id, context) => {
    await deleteRowWithImages(
      async () => {
        const images = await prisma.articleImage.findMany({
          select: { id: true },
          where: { articleId: id },
        })
        return images.map((image) => image.id)
      },
      () =>
        refuseWhenHeld(
          () =>
            // PageSEO is a standalone row keyed by pathname (no FK back to the
            // article), so it must be removed explicitly — otherwise its unique
            // pathname blocks recreating an article with the same slug. Read the
            // slug and delete both rows in one transaction so nothing can change
            // between the read and the deletes.
            prisma.$transaction(async (transaction) => {
              const { slug } = await transaction.article.findUniqueOrThrow({
                select: { slug: true },
                where: { id },
              })
              if (slug !== null) {
                await transaction.pageSEO.deleteMany({
                  where: { pathname: buildPathname(slug) },
                })
              }
              // Not while someone else edits it; the PageSEO delete rolls back.
              return transaction.article.delete({
                where: {
                  AND: [
                    buildNotHeldByOthersWhere(context.authorId, new Date()),
                  ],
                  id,
                },
              })
            }),
          () => findArticleHeldByName(id, context.authorId),
        ),
    )
  },

  ensureApprovingReview: async (id, reviewerId) => {
    const existingReview = await prisma.review.findFirst({
      where: { articleId: id, reviewerId },
    })

    // Nothing to write, but approving still waits for someone else's edit.
    if (existingReview) {
      const heldByName = await findArticleHeldByName(id, reviewerId)

      if (heldByName !== null) throw createEditHeldRefusal(heldByName)
    } else {
      // Through the article, so the approval repeats its hold condition.
      await refuseWhenHeld(
        () =>
          prisma.article.update({
            data: {
              reviews: { create: { reviewerId, state: 'approved' } },
            },
            select: { id: true },
            where: {
              AND: [buildNotHeldByOthersWhere(reviewerId, new Date())],
              id,
            },
          }),
        () => findArticleHeldByName(id, reviewerId),
      )
    }
  },
  entity: 'article',

  getMissingBeforePublish: async (id) => {
    const article = await prisma.article.findUniqueOrThrow({
      select: {
        _count: { select: { authors: true } },
        content: true,
        images: { select: { altText: true } },
        perex: true,
        slug: true,
        title: true,
      },
      where: { id },
    })

    return getMissingArticleContent({
      authorCount: article._count.authors,
      content: article.content,
      images: article.images,
      perex: article.perex,
      slug: article.slug,
      title: article.title,
    })
  },

  loadPublishState: async (id) => {
    const article = await prisma.article.findUniqueOrThrow({
      select: {
        authors: { select: { role: { select: { level: true } } } },
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
      authors: article.authors,
      publishedAt: article.publishedAt,
      reviews: article.reviews,
      submittedAt: article.submittedAt,
    }
  },
})
