type RoleFlag = { publishRequiresReview: boolean }

/**
 * A role exempt from the review-before-publish requirement. A review submitted
 * by such a role is also what satisfies the requirement for other content.
 */
export const canPublishWithoutReview = (role: RoleFlag): boolean =>
  !role.publishRequiresReview

/**
 * True when content still needs an approving review before it can be published:
 * every author's role requires review AND no review exists from a reviewer whose
 * role does not.
 */
export const needsReviewToPublish = (input: {
  authors: { role: RoleFlag }[]
  reviews: { reviewer: { role: RoleFlag } }[]
}): boolean =>
  input.authors.every((author) => author.role.publishRequiresReview) &&
  !input.reviews.some((review) => canPublishWithoutReview(review.reviewer.role))
