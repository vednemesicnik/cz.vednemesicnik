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

import { findPublishedSlugConflict } from '../../../utils/find-published-slug-conflict.server'
import { resolveArticleFeaturedImageSeo } from '../../../utils/resolve-article-featured-image-seo.server'
import { findArticleHeldRefusal } from './find-article-held-refusal.server'
import { getMissingArticleContent } from './get-missing-article-content'
import { MISSING_SLUG_ITEM, TAKEN_SLUG_ITEM } from './slug-items'

const buildPathname = (slug: string) => `/articles/${slug}`

const RELEASED_HOLD = {
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
}

/**
 * Publishes the article's address (log 0039): in one transaction, the article
 * takes its typed address as the one it holds, and its PageSEO record moves
 * there with the sharing preview of the main image. An address another article
 * took since the check before it blocks the publish as missing content.
 */
const publishAddress = async (
  id: string,
  articleData: StateTransitionData & Record<string, unknown>,
  notHeldWhere: { AND: object[]; id: string },
  authorId: string,
) => {
  const stored = await prisma.article.findUniqueOrThrow({
    select: { featuredImageId: true },
    where: { id },
  })
  const { ogImageUrl, twitterImageUrl } = await resolveArticleFeaturedImageSeo(
    stored.featuredImageId,
  )

  try {
    await refuseWhenHeld(
      () =>
        prisma.$transaction(async (transaction) => {
          const { publishedSlug: previousSlug, slug } =
            await transaction.article.findUniqueOrThrow({
              select: { publishedSlug: true, slug: true },
              where: { id },
            })

          // Cleared since the check before it: publishing needs an address
          // (23h), and nothing is written.
          if (slug === null) {
            throw createMissingContentError([MISSING_SLUG_ITEM])
          }

          const article = await transaction.article.update({
            data: { ...articleData, publishedSlug: slug },
            select: { perex: true, title: true },
            where: notHeldWhere,
          })

          const pathname = buildPathname(slug)

          // Published under another address, the old record goes.
          if (previousSlug !== null && previousSlug !== slug) {
            await transaction.pageSEO.deleteMany({
              where: { pathname: buildPathname(previousSlug) },
            })
          }

          await transaction.pageSEO.upsert({
            create: {
              authorId,
              description: article.perex || null,
              ogImageUrl,
              pathname,
              publishedAt: articleData.publishedAt,
              state: 'published',
              title: article.title,
              twitterImageUrl,
            },
            update: {
              description: article.perex || null,
              ogImageUrl,
              publishedAt: articleData.publishedAt,
              state: 'published',
              title: article.title,
              twitterImageUrl,
            },
            where: { pathname },
          })
        }),
      () => findArticleHeldRefusal(id, authorId),
    )
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw createMissingContentError([TAKEN_SLUG_ITEM])
    }
    throw error
  }
}

/**
 * Article state-transition handlers. The article is the only entity that mirrors
 * every transition onto its standalone PageSEO row, written at publish (log
 * 0039), it accepts an approver
 * backdate on publish, the Coordinator publishes it without a prior review, and an
 * incomplete article is not published (design 23h).
 */
export const articleContentStateHandlers = createContentStateHandlers({
  allowBackdating: true,
  applyState: async (id, data, authorId) => {
    const articleData = {
      // Retract/restore also wipe reviews; PageSEO has no reviews to clear.
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
      await publishAddress(id, articleData, notHeldWhere, authorId)
      return
    }

    const updatedArticle = await refuseWhenHeld(
      () =>
        prisma.article.update({
          data: articleData,
          select: { publishedSlug: true },
          where: notHeldWhere,
        }),
      () => findArticleHeldRefusal(id, authorId),
    )

    // Mirror the same columns onto the standalone PageSEO row of the address
    // the article holds; one never published has none (log 0039).
    if (updatedArticle.publishedSlug !== null) {
      await prisma.pageSEO.updateMany({
        data,
        where: { pathname: buildPathname(updatedArticle.publishedSlug) },
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
            // pathname blocks publishing another article at that address. Read
            // the address the article holds and delete both rows in one
            // transaction so nothing can change between the read and the
            // deletes.
            prisma.$transaction(async (transaction) => {
              const { publishedSlug } =
                await transaction.article.findUniqueOrThrow({
                  select: { publishedSlug: true },
                  where: { id },
                })
              if (publishedSlug !== null) {
                await transaction.pageSEO.deleteMany({
                  where: { pathname: buildPathname(publishedSlug) },
                })
              }
              // Not while any editor holds it, one's own in another tab too
              // (log 0036); the PageSEO delete rolls back.
              return transaction.article.delete({
                where: { AND: [buildFreeHoldWhere(new Date())], id },
              })
            }),
          () =>
            findArticleHeldRefusal(id, context.authorId, {
              countsOwnOtherTab: true,
            }),
        ),
    )
  },

  ensureApprovingReview: async (id, reviewerId) => {
    const existingReview = await prisma.review.findFirst({
      where: { articleId: id, reviewerId },
    })

    // Nothing to write, but approving still waits for someone else's edit.
    if (existingReview) {
      const refusal = await findArticleHeldRefusal(id, reviewerId)

      if (refusal !== null) throw createEditHeldRefusal(refusal)
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
        () => findArticleHeldRefusal(id, reviewerId),
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
      isSlugTaken:
        (await findPublishedSlugConflict({
          articleId: id,
          slug: article.slug,
        })) !== null,
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
