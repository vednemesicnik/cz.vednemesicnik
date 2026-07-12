type RoleLevel = { level: number }

/**
 * Content-axis approver threshold: roles at this level or above (currently only
 * coordinator, level 1) publish without review, and their approving review
 * unlocks publishing for content authored by lower roles.
 */
export const APPROVER_ROLE_LEVEL = 1

/**
 * A role exempt from the review-before-publish requirement. A review submitted
 * by such a role is also what satisfies the requirement for other content.
 */
export const canPublishWithoutReview = (role: RoleLevel): boolean =>
  role.level <= APPROVER_ROLE_LEVEL

/**
 * True when content still needs an approving review before it can be published:
 * every author's role requires review AND no review exists from an
 * approver-level reviewer.
 */
export const needsReviewToPublish = (input: {
  authors: { role: RoleLevel }[]
  reviews: { reviewer: { role: RoleLevel } }[]
}): boolean =>
  input.authors.every((author) => !canPublishWithoutReview(author.role)) &&
  !input.reviews.some((review) => canPublishWithoutReview(review.reviewer.role))
