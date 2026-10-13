import { describe, expect, test } from 'vitest'

import { getArticleFactLine } from './get-article-fact-line'

const now = new Date('2026-10-12T18:30:00Z')

const base = {
  now,
  publishedAt: null,
  state: 'draft' as const,
  submission: null,
  updatedAt: new Date('2026-09-22T08:00:00Z'),
}

describe('getArticleFactLine', () => {
  test('a draft saved today gives the time', () => {
    expect(
      getArticleFactLine({
        ...base,
        updatedAt: new Date('2026-10-12T12:02:00Z'),
      }),
    ).toBe('uloženo dnes v 14:02')
  })

  test('a draft saved another day gives the date', () => {
    expect(getArticleFactLine(base)).toBe('uloženo 22. 9. 2026')
  })

  test('today is the Prague day, not the UTC one', () => {
    expect(
      getArticleFactLine({
        ...base,
        now: new Date('2026-10-12T22:30:00Z'),
        updatedAt: new Date('2026-10-12T21:00:00Z'),
      }),
    ).toBe('uloženo 12. 10. 2026')
  })

  test('a waiting draft gives since when', () => {
    expect(
      getArticleFactLine({
        ...base,
        submission: {
          date: new Date('2026-09-25T10:00:00Z'),
          state: 'pending',
        },
      }),
    ).toBe('od 25. 9. 2026')
  })

  test('an approved draft gives the approval date', () => {
    expect(
      getArticleFactLine({
        ...base,
        submission: {
          date: new Date('2026-09-27T10:00:00Z'),
          state: 'approved',
        },
      }),
    ).toBe('27. 9. 2026')
  })

  test('a published article gives its publish date', () => {
    expect(
      getArticleFactLine({
        ...base,
        publishedAt: new Date('2026-09-24T10:00:00Z'),
        state: 'published',
      }),
    ).toBe('24. 9. 2026')
  })

  test('an archived article gives its last update', () => {
    expect(
      getArticleFactLine({
        ...base,
        state: 'archived',
        updatedAt: new Date('2026-06-02T10:00:00Z'),
      }),
    ).toBe('2. 6. 2026')
  })
})
