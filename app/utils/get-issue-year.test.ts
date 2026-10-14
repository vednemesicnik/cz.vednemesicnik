import { describe, expect, test } from 'vitest'

import { getIssueYear } from './get-issue-year'

describe('getIssueYear', () => {
  test('is the year of the release', () => {
    expect(getIssueYear(new Date('2026-09-15T08:00:00Z'))).toBe('2026')
  })

  test('counts Prague midnight on New Year as the new year', () => {
    // 1 January 2026, 00:00 in Prague is still 2025 in UTC.
    expect(getIssueYear(new Date('2025-12-31T23:00:00Z'))).toBe('2026')
  })
})
