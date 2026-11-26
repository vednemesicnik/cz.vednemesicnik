import { describe, expect, test } from 'vitest'

import { getIssuePdfFileName } from './get-issue-pdf-file-name'

describe('getIssuePdfFileName', () => {
  test('is the year and the order for a main issue', () => {
    expect(
      getIssuePdfFileName({ order: 4, supplementSlug: '', year: 2026 }),
    ).toBe('VDM-2026-4.pdf')
  })

  test("adds a supplement's slug", () => {
    expect(
      getIssuePdfFileName({
        order: 2,
        supplementSlug: 'maturitni-ples',
        year: 2026,
      }),
    ).toBe('VDM-2026-2-maturitni-ples.pdf')
  })
})
