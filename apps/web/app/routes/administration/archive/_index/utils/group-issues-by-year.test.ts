import { describe, expect, test } from 'vitest'

import { groupIssuesByYear } from './group-issues-by-year'

describe('groupIssuesByYear', () => {
  test('groups consecutive rows by year, in their order (26a)', () => {
    expect(
      groupIssuesByYear([
        { id: 'a', year: null },
        { id: 'b', year: 2026 },
        { id: 'c', year: 2026 },
        { id: 'd', year: 2025 },
      ]),
    ).toEqual([
      { issues: [{ id: 'a', year: null }], year: null },
      {
        issues: [
          { id: 'b', year: 2026 },
          { id: 'c', year: 2026 },
        ],
        year: 2026,
      },
      { issues: [{ id: 'd', year: 2025 }], year: 2025 },
    ])
  })

  test('an empty page has no groups', () => {
    expect(groupIssuesByYear([])).toEqual([])
  })
})
