import { describe, expect, test } from 'vitest'

import { buildContentQueueWhere } from './build-content-queue-where'

const approvingReview = { reviewer: { role: { level: { lte: 1 } } } }

describe('buildContentQueueWhere', () => {
  test('Koncepty are the unsubmitted drafts', () => {
    expect(buildContentQueueWhere('draft')).toEqual({
      state: 'draft',
      submittedAt: null,
    })
  })

  test('Ke schválení are submitted drafts without an approving review', () => {
    expect(buildContentQueueWhere('pending')).toEqual({
      reviews: { none: approvingReview },
      state: 'draft',
      submittedAt: { not: null },
    })
  })

  test('Schválené are submitted drafts with an approving review', () => {
    expect(buildContentQueueWhere('approved')).toEqual({
      reviews: { some: approvingReview },
      state: 'draft',
      submittedAt: { not: null },
    })
  })

  test('Odeslané are all submitted drafts', () => {
    expect(buildContentQueueWhere('submitted')).toEqual({
      state: 'draft',
      submittedAt: { not: null },
    })
  })

  test('published and archived are the data state', () => {
    expect(buildContentQueueWhere('published')).toEqual({ state: 'published' })
    expect(buildContentQueueWhere('archived')).toEqual({ state: 'archived' })
  })
})
