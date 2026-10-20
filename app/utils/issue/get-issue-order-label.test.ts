import { describe, expect, test } from 'vitest'

import { getIssueOrderLabel } from './get-issue-order-label'

describe('getIssueOrderLabel', () => {
  test('is the order over the year', () => {
    expect(getIssueOrderLabel({ order: 4, year: 2026 })).toBe('4/2026')
  })
})
