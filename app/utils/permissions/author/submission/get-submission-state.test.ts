import { describe, expect, test } from 'vitest'

import { getSubmissionState } from './get-submission-state'

const submittedAt = new Date('2026-10-13T10:00:00Z')
const reviewedAt = new Date('2026-10-14T09:00:00Z')

const coordinatorReview = {
  createdAt: reviewedAt,
  reviewer: { role: { level: 1 } },
}
const creatorReview = {
  createdAt: reviewedAt,
  reviewer: { role: { level: 2 } },
}

describe('getSubmissionState', () => {
  test('a draft nobody submitted has none', () => {
    expect(
      getSubmissionState({ reviews: [], state: 'draft', submittedAt: null }),
    ).toBeNull()
  })

  test('a submitted draft waits since it was sent', () => {
    expect(
      getSubmissionState({ reviews: [], state: 'draft', submittedAt }),
    ).toEqual({ date: submittedAt, state: 'pending' })
  })

  test('a review below the approver level leaves it waiting', () => {
    expect(
      getSubmissionState({
        reviews: [creatorReview],
        state: 'draft',
        submittedAt,
      }),
    ).toEqual({ date: submittedAt, state: 'pending' })
  })

  test("the approver's review approves it, dated by the review", () => {
    expect(
      getSubmissionState({
        reviews: [coordinatorReview],
        state: 'draft',
        submittedAt,
      }),
    ).toEqual({ date: reviewedAt, state: 'approved' })
  })

  test('published and archived content has none', () => {
    for (const state of ['published', 'archived'] as const) {
      expect(
        getSubmissionState({
          reviews: [coordinatorReview],
          state,
          submittedAt,
        }),
      ).toBeNull()
    }
  })
})
