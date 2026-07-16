import { describe, expect, test } from 'vitest'

import { canPublishWithoutReview, needsReviewToPublish } from './review-policy'

// Approver = coordinator (level 1); creator (2) and contributor (3) require review.
const approver = { level: 1 }
const requiresReview = { level: 2 }
const alsoRequiresReview = { level: 3 }

describe('canPublishWithoutReview', () => {
  test('true for an approver-level role', () => {
    expect(canPublishWithoutReview(approver)).toBe(true)
  })

  test('false for a role that requires review', () => {
    expect(canPublishWithoutReview(requiresReview)).toBe(false)
    expect(canPublishWithoutReview(alsoRequiresReview)).toBe(false)
  })
})

describe('needsReviewToPublish', () => {
  test('false when an author is an approver (no review needed)', () => {
    expect(
      needsReviewToPublish({
        authors: [{ role: approver }],
        reviews: [],
      }),
    ).toBe(false)
  })

  test('false when an approving review from an approver-level reviewer exists', () => {
    expect(
      needsReviewToPublish({
        authors: [{ role: requiresReview }],
        reviews: [{ reviewer: { role: approver } }],
      }),
    ).toBe(false)
  })

  test('true when authors require review and no approving review exists', () => {
    expect(
      needsReviewToPublish({
        authors: [{ role: requiresReview }],
        reviews: [],
      }),
    ).toBe(true)
  })

  test('true when the only review is from a non-approver reviewer', () => {
    expect(
      needsReviewToPublish({
        authors: [{ role: requiresReview }],
        reviews: [{ reviewer: { role: requiresReview } }],
      }),
    ).toBe(true)
  })

  test('false when author is an approver and an approving review also exists', () => {
    expect(
      needsReviewToPublish({
        authors: [{ role: approver }],
        reviews: [{ reviewer: { role: approver } }],
      }),
    ).toBe(false)
  })

  test('false when any author among several is an approver', () => {
    expect(
      needsReviewToPublish({
        authors: [{ role: requiresReview }, { role: approver }],
        reviews: [],
      }),
    ).toBe(false)
  })
})
