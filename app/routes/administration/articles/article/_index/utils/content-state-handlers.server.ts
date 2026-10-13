import { clearSubmissionOnStateChange } from '~/utils/content-state/clear-submission-on-state-change'
import {
  clearReviewsOnDraft,
  createContentStateHandlers,
} from '~/utils/content-state/create-content-state-handlers.server'
import { prisma } from '~/utils/db.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'

import { getMissingArticleContent } from './get-missing-article-content'

const buildPathname = (slug: string) => `/articles/${slug}`

/**
 * Article state-transition handlers. The article is the only entity that mirrors
 * every transition onto its standalone PageSEO row, it accepts an approver
 * backdate on publish, the Coordinator publishes it without a prior review, and an
 * incomplete article is not published (design 23h).
 */
export const articleContentStateHandlers = createContentStateHandlers({
  allowBackdating: true,
  applyState: async (id, data) => {
    const updatedArticle = await prisma.article.update({
      // Retract/restore also wipe reviews; PageSEO has no reviews to clear.
      data: clearSubmissionOnStateChange(clearReviewsOnDraft(data)),
      select: { slug: true },
      where: { id },
    })

    // Mirror the same columns onto the standalone PageSEO row keyed by pathname.
    await prisma.pageSEO.updateMany({
      data,
      where: { pathname: buildPathname(updatedArticle.slug) },
    })
  },
  approverPublishesWithoutReview: true,

  deleteRow: async (id) => {
    await deleteRowWithImages(
      async () => {
        const images = await prisma.articleImage.findMany({
          select: { id: true },
          where: { articleId: id },
        })
        return images.map((image) => image.id)
      },
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
          await transaction.pageSEO.deleteMany({
            where: { pathname: buildPathname(slug) },
          })
          return transaction.article.delete({ where: { id } })
        }),
    )
  },

  ensureApprovingReview: async (id, reviewerId) => {
    const existingReview = await prisma.review.findFirst({
      where: { articleId: id, reviewerId },
    })

    if (!existingReview) {
      await prisma.review.create({
        data: { articleId: id, reviewerId, state: 'approved' },
      })
    }
  },
  entity: 'article',

  getMissingBeforePublish: async (id) => {
    const article = await prisma.article.findUniqueOrThrow({
      select: {
        _count: { select: { authors: true } },
        content: true,
        excerpt: true,
        images: { select: { altText: true } },
        slug: true,
        title: true,
      },
      where: { id },
    })

    return getMissingArticleContent({
      authorCount: article._count.authors,
      content: article.content,
      excerpt: article.excerpt,
      images: article.images,
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
