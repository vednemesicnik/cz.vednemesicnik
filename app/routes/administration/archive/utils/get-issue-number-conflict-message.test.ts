import { describe, expect, test } from 'vitest'

import { getIssueNumberConflictMessage } from './get-issue-number-conflict-message'

const holder = { name: null, order: 3, supplement: null, year: 2026 }

describe('getIssueNumberConflictMessage', () => {
  test('names a holder with a name', () => {
    expect(getIssueNumberConflictMessage({ ...holder, name: 'září' })).toEqual({
      field: 'order',
      message: 'Zvolte jiné pořadí — 3/2026 už má číslo září 2026.',
    })
  })

  test('names a holder without a name only once', () => {
    expect(getIssueNumberConflictMessage(holder)).toEqual({
      field: 'order',
      message: 'Zvolte jiné pořadí — číslo 3/2026 už existuje.',
    })
  })

  test('puts a taken supplement under the supplement', () => {
    expect(
      getIssueNumberConflictMessage({
        ...holder,
        order: 2,
        supplement: 'Maturitní ples',
      }),
    ).toEqual({
      field: 'supplement',
      message:
        'Zkontrolujte rok, pořadí a název doplňku — doplněk Maturitní ples pro 2/2026 už existuje.',
    })
  })
})
