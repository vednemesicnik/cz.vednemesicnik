import { describe, expect, test } from 'vitest'

import { canPublishWithoutReview, needsReviewToPublish } from './review-policy'

const requiresReview = { publishRequiresReview: true }
const exempt = { publishRequiresReview: false }

describe('canPublishWithoutReview', () => {
  test('true for an exempt role', () => {
    expect(canPublishWithoutReview(exempt)).toBe(true)
  })

  test('false for a role that requires review', () => {
    expect(canPublishWithoutReview(requiresReview)).toBe(false)
  })
})

describe('needsReviewToPublish', () => {
  test('false when an author is exempt (no review needed)', () => {
    expect(
      needsReviewToPublish({
        authors: [{ role: exempt }],
        reviews: [],
      }),
    ).toBe(false)
  })

  test('false when an approving review from an exempt reviewer exists', () => {
    expect(
      needsReviewToPublish({
        authors: [{ role: requiresReview }],
        reviews: [{ reviewer: { role: exempt } }],
      }),
    ).toBe(false)
  })

  test('true when authors require review and no exempt review exists', () => {
    expect(
      needsReviewToPublish({
        authors: [{ role: requiresReview }],
        reviews: [],
      }),
    ).toBe(true)
  })

  test('true when the only review is from a non-exempt reviewer', () => {
    expect(
      needsReviewToPublish({
        authors: [{ role: requiresReview }],
        reviews: [{ reviewer: { role: requiresReview } }],
      }),
    ).toBe(true)
  })

  test('false when author is exempt and an approving review also exists', () => {
    expect(
      needsReviewToPublish({
        authors: [{ role: exempt }],
        reviews: [{ reviewer: { role: exempt } }],
      }),
    ).toBe(false)
  })

  test('false when any author among several is exempt', () => {
    expect(
      needsReviewToPublish({
        authors: [{ role: requiresReview }, { role: exempt }],
        reviews: [],
      }),
    ).toBe(false)
  })
})
