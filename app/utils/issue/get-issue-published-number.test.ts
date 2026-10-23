import { describe, expect, test } from 'vitest'

import { getIssuePublishedNumber } from './get-issue-published-number'

describe('getIssuePublishedNumber', () => {
  test('is the year and the order for a main issue', () => {
    expect(
      getIssuePublishedNumber({ order: 4, supplementSlug: '', year: 2026 }),
    ).toBe('2026-4')
  })

  test("adds a supplement's slug", () => {
    expect(
      getIssuePublishedNumber({
        order: 2,
        supplementSlug: 'maturitni-ples',
        year: 2026,
      }),
    ).toBe('2026-2-maturitni-ples')
  })
})
