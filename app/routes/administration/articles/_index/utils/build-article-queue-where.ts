import type { Prisma } from '@generated/prisma/client'

import type { ArticleQueue } from '~/config/article-queue-config'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

// A review counts as approval only from an approver role (review-policy).
const approvingReview: Prisma.ReviewWhereInput = {
  reviewer: { role: { level: { lte: APPROVER_ROLE_LEVEL } } },
}

const submittedDraft: Prisma.ArticleWhereInput = {
  state: 'draft',
  submittedAt: { not: null },
}

/**
 * The article list's queue as a Prisma condition (design 22a, 07a).
 *
 * @param queue - The `?state=` queue.
 * @returns `draft` an unsubmitted draft; `pending` a submitted draft without an
 *   approving review, `approved` with one, `submitted` either; `published` and
 *   `archived` the data state.
 */
export const buildArticleQueueWhere = (
  queue: ArticleQueue,
): Prisma.ArticleWhereInput => {
  switch (queue) {
    case 'draft':
      return { state: 'draft', submittedAt: null }
    case 'pending':
      return { ...submittedDraft, reviews: { none: approvingReview } }
    case 'approved':
      return { ...submittedDraft, reviews: { some: approvingReview } }
    case 'submitted':
      return submittedDraft
    case 'published':
    case 'archived':
      return { state: queue }
  }
}
