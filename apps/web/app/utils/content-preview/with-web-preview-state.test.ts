import { describe, expect, test } from 'vitest'

import { withWebPreviewState } from './with-web-preview-state'

describe('withWebPreviewState', () => {
  test('a published row keeps its fields and carries no tag', () => {
    expect(
      withWebPreviewState({
        name: 'Kultura',
        reviews: [],
        slug: 'kultura',
        state: 'published',
        submittedAt: null,
      }),
    ).toEqual({ name: 'Kultura', previewState: null, slug: 'kultura' })
  })

  test('a submitted draft row waits', () => {
    expect(
      withWebPreviewState({
        name: 'Glosy',
        reviews: [],
        slug: 'glosy',
        state: 'draft',
        submittedAt: new Date('2026-10-30T10:00:00Z'),
      }),
    ).toEqual({ name: 'Glosy', previewState: 'pending', slug: 'glosy' })
  })
})
