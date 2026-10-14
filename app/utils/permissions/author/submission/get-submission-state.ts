import type { ContentState } from '@generated/prisma/enums'

import { canPublishWithoutReview } from '~/utils/permissions/author/review-policy'

type Content = {
  state: ContentState
  submittedAt: Date | null
  reviews: { createdAt: Date; reviewer: { role: { level: number } } }[]
}

/** A submitted draft: waiting since it was sent, or approved since its approving review. */
export type SubmissionState = {
  date: Date
  state: 'pending' | 'approved'
}

/**
 * Where a draft stands in review (design 07a, 07d), for its detail and its
 * list row alike, so both show the same tag.
 *
 * @param content - Its state, submission and reviews.
 * @returns `pending` since the draft was submitted, `approved` since an
 *   approver's review, or `null` for a draft nobody submitted and for
 *   published and archived content.
 */
export const getSubmissionState = (
  content: Content,
): SubmissionState | null => {
  if (content.state !== 'draft' || content.submittedAt === null) {
    return null
  }

  const approvingReview = content.reviews.find((review) =>
    canPublishWithoutReview(review.reviewer.role),
  )

  return approvingReview === undefined
    ? { date: content.submittedAt, state: 'pending' }
    : { date: approvingReview.createdAt, state: 'approved' }
}
