import { describe, expect, test } from 'vitest'

import { getTakenIssueNumberMessage } from './get-taken-issue-number-message'

describe('getTakenIssueNumberMessage', () => {
  test('asks for another order (26d)', () => {
    expect(
      getTakenIssueNumberMessage({
        field: 'order',
        order: 3,
        supplement: null,
        year: 2026,
      }),
    ).toBe('Zadejte jiné pořadí — číslo 3/2026 je obsazené.')
  })

  test('asks for another year or order after the year changed', () => {
    expect(
      getTakenIssueNumberMessage({
        field: 'year',
        order: 3,
        supplement: null,
        year: 2025,
      }),
    ).toBe('Zadejte jiný rok nebo pořadí — číslo 3/2025 je obsazené.')
  })

  test.each(['year', 'order', 'supplement'] as const)(
    "names a supplement's name whichever field changed (%s)",
    (field) => {
      expect(
        getTakenIssueNumberMessage({
          field,
          order: 2,
          supplement: 'Maturitní ples',
          year: 2026,
        }),
      ).toBe(
        'Zkontrolujte rok, pořadí a název doplňku — název „Maturitní ples“ je pro číslo 2/2026 obsazený.',
      )
    },
  )
})
