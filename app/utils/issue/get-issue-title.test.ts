import { describe, expect, test } from 'vitest'

import { getIssueTitle } from './get-issue-title'

const issue = { name: null, order: 4, supplement: null, year: 2026 }

describe('getIssueTitle', () => {
  test('is the name with the year', () => {
    expect(getIssueTitle({ ...issue, name: 'podzim' })).toBe('podzim 2026')
  })

  test('is the order without a name', () => {
    expect(getIssueTitle(issue)).toBe('4/2026')
  })

  test('names a supplement after its main issue', () => {
    expect(
      getIssueTitle(
        { ...issue, order: 2, supplement: 'Maturitní ples' },
        'červen',
      ),
    ).toBe('Maturitní ples · doplněk k číslu červen 2026')
  })

  test('names a supplement by the order when the main issue has no name', () => {
    expect(
      getIssueTitle({ ...issue, order: 2, supplement: 'Maturitní ples' }),
    ).toBe('Maturitní ples · doplněk k číslu 2/2026')
  })

  test("ignores the supplement's own name for the main issue", () => {
    expect(
      getIssueTitle({ ...issue, name: 'jaro', supplement: 'Maturitní ples' }),
    ).toBe('Maturitní ples · doplněk k číslu 4/2026')
  })
})
