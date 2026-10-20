import { describe, expect, test } from 'vitest'

import { getNextFreeIssueOrder } from './get-next-free-issue-order'

describe('getNextFreeIssueOrder', () => {
  test('is 1 in a year without issues', () => {
    expect(getNextFreeIssueOrder([])).toBe(1)
  })

  test('follows the highest order', () => {
    expect(getNextFreeIssueOrder([1, 3, 2])).toBe(4)
  })

  test('leaves a gap as it is', () => {
    expect(getNextFreeIssueOrder([1, 3])).toBe(4)
  })
})
