import { describe, expect, it } from 'vitest'

import { formatNumericDate } from './format-numeric-date'

describe('formatNumericDate', () => {
  it('formats day, month and year with dots and spaces', () => {
    expect(formatNumericDate(new Date('2025-10-14T10:00:00Z'))).toBe(
      '14. 10. 2025',
    )
  })

  it('uses Prague time, not UTC', () => {
    // 23:30 UTC on 2 September is already 3 September in Prague (UTC+2).
    expect(formatNumericDate(new Date('2026-09-02T23:30:00Z'))).toBe(
      '3. 9. 2026',
    )
  })
})
