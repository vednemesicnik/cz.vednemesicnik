import { describe, expect, test } from 'vitest'

import { getWebPreviewState } from './get-web-preview-state'

const coordinatorReview = {
  createdAt: new Date('2026-10-02T10:00:00Z'),
  reviewer: { role: { level: 1 } },
}

describe('getWebPreviewState', () => {
  test('published content carries no tag', () => {
    expect(
      getWebPreviewState({
        reviews: [],
        state: 'published',
        submittedAt: null,
      }),
    ).toBeNull()
  })

  test('a draft nobody submitted is a draft', () => {
    expect(
      getWebPreviewState({ reviews: [], state: 'draft', submittedAt: null }),
    ).toBe('draft')
  })

  test('a submitted draft waits', () => {
    expect(
      getWebPreviewState({
        reviews: [],
        state: 'draft',
        submittedAt: new Date('2026-10-01T10:00:00Z'),
      }),
    ).toBe('pending')
  })

  test("a submitted draft with the Coordinator's review is approved", () => {
    expect(
      getWebPreviewState({
        reviews: [coordinatorReview],
        state: 'draft',
        submittedAt: new Date('2026-10-01T10:00:00Z'),
      }),
    ).toBe('approved')
  })

  test('archived content is archived', () => {
    expect(
      getWebPreviewState({ reviews: [], state: 'archived', submittedAt: null }),
    ).toBe('archived')
  })
})
