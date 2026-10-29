import { describe, expect, test } from 'vitest'

import { groupIssuesByYear } from './group-issues-by-year'

describe('groupIssuesByYear', () => {
  test('groups issues under their year in the order they come', () => {
    const issues = [
      { id: 'a', year: 2026 },
      { id: 'b', year: 2026 },
      { id: 'c', year: 2024 },
    ]

    expect(groupIssuesByYear(issues)).toEqual([
      { issues: [issues[0], issues[1]], year: 2026 },
      { issues: [issues[2]], year: 2024 },
    ])
  })

  test('has no group without an issue', () => {
    expect(groupIssuesByYear([])).toEqual([])
  })
})
