import { describe, expect, it } from 'vitest'

import { formatNumericDateTime } from './format-numeric-date-time'

describe('formatNumericDateTime', () => {
  it('joins the date and the time with a comma', () => {
    expect(formatNumericDateTime(new Date('2026-09-25T17:14:00Z'))).toBe(
      '25. 9. 2026, 19:14',
    )
  })

  it('keeps a single-digit hour without a leading zero', () => {
    expect(formatNumericDateTime(new Date('2026-09-24T06:03:00Z'))).toBe(
      '24. 9. 2026, 8:03',
    )
  })

  it('uses Prague time, not UTC', () => {
    // 23:30 UTC on 2 September is already 3 September in Prague (UTC+2).
    expect(formatNumericDateTime(new Date('2026-09-02T23:30:00Z'))).toBe(
      '3. 9. 2026, 1:30',
    )
  })
})
