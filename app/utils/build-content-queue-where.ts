import type { ContentState } from '@generated/prisma/enums'

import type { ContentQueue } from '~/config/content-queue-config'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

/**
 * The fields every content model shares for its queue (decision 0013), so the
 * condition fits any of their `WhereInput`s.
 */
type ContentQueueWhere = {
  state: ContentState
  submittedAt?: null | { not: null }
  reviews?: { none: ApprovingReviewWhere } | { some: ApprovingReviewWhere }
}

type ApprovingReviewWhere = {
  reviewer: { role: { level: { lte: number } } }
}

// A review counts as approval only from an approver role (review-policy).
const approvingReview: ApprovingReviewWhere = {
  reviewer: { role: { level: { lte: APPROVER_ROLE_LEVEL } } },
}

const submittedDraft = {
  state: 'draft',
  submittedAt: { not: null },
} as const satisfies ContentQueueWhere

/**
 * A Stav queue as a Prisma condition (design 22a, 25a, 07a), for any content
 * model: they all carry `state`, `submittedAt` and `reviews`.
 *
 * @param queue - The `?state=` queue.
 * @returns `draft` an unsubmitted draft; `pending` a submitted draft without an
 *   approving review, `approved` with one, `submitted` either; `published` and
 *   `archived` the data state.
 */
export const buildContentQueueWhere = (
  queue: ContentQueue,
): ContentQueueWhere => {
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
