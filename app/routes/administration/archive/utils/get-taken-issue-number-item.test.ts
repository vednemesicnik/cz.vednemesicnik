import { describe, expect, test } from 'vitest'

import { getTakenIssueNumberItem } from './get-taken-issue-number-item'

describe('getTakenIssueNumberItem', () => {
  test('names the number of a main issue', () => {
    expect(
      getTakenIssueNumberItem({ order: 3, supplement: null, year: 2026 }),
    ).toBe('Číslo 3/2026 je obsazené.')
  })

  test("names a supplement's name and its number", () => {
    expect(
      getTakenIssueNumberItem({
        order: 2,
        supplement: 'Maturitní ples',
        year: 2026,
      }),
    ).toBe('Název „Maturitní ples“ je pro číslo 2/2026 obsazený.')
  })
})
