import { describe, expect, test } from 'vitest'

import { getIssueLinkLabel } from './get-issue-link-label'

const issue = { name: null, order: 1, supplement: null, year: 2026 }

describe('getIssueLinkLabel', () => {
  test('reads a named issue with its order', () => {
    expect(getIssueLinkLabel({ ...issue, name: 'podzim', order: 3 })).toBe(
      'podzim 2026, číslo 3, PDF',
    )
  })

  test('spells out the order without a name', () => {
    expect(getIssueLinkLabel(issue)).toBe('Číslo 1 z roku 2026, PDF')
  })

  test('reads a supplement with the name of its main issue', () => {
    expect(
      getIssueLinkLabel(
        { ...issue, order: 2, supplement: 'Maturitní ples' },
        'červen',
      ),
    ).toBe('Maturitní ples, doplněk k číslu červen 2026, PDF')
  })

  test('reads a supplement by the order when its main issue has no visible name', () => {
    expect(
      getIssueLinkLabel({ ...issue, order: 2, supplement: 'Maturitní ples' }),
    ).toBe('Maturitní ples, doplněk k číslu 2 z roku 2026, PDF')
  })
})
