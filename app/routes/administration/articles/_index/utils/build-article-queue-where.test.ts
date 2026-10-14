import { describe, expect, test } from 'vitest'

import { buildArticleQueueWhere } from './build-article-queue-where'

const approvingReview = { reviewer: { role: { level: { lte: 1 } } } }

describe('buildArticleQueueWhere', () => {
  test('Koncepty are the unsubmitted drafts', () => {
    expect(buildArticleQueueWhere('draft')).toEqual({
      state: 'draft',
      submittedAt: null,
    })
  })

  test('Ke schválení are submitted drafts without an approving review', () => {
    expect(buildArticleQueueWhere('pending')).toEqual({
      reviews: { none: approvingReview },
      state: 'draft',
      submittedAt: { not: null },
    })
  })

  test('Schválené are submitted drafts with an approving review', () => {
    expect(buildArticleQueueWhere('approved')).toEqual({
      reviews: { some: approvingReview },
      state: 'draft',
      submittedAt: { not: null },
    })
  })

  test('Odeslané are all submitted drafts', () => {
    expect(buildArticleQueueWhere('submitted')).toEqual({
      state: 'draft',
      submittedAt: { not: null },
    })
  })

  test('published and archived are the data state', () => {
    expect(buildArticleQueueWhere('published')).toEqual({ state: 'published' })
    expect(buildArticleQueueWhere('archived')).toEqual({ state: 'archived' })
  })
})
