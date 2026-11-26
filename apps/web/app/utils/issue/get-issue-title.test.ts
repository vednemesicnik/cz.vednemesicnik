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

  test('keeps a named title without the order', () => {
    expect(getIssueTitle({ ...issue, name: 'podzim', order: null })).toBe(
      'podzim 2026',
    )
  })

  test('says what a named draft lacks without the year', () => {
    expect(getIssueTitle({ ...issue, name: 'podzim', year: null })).toBe(
      'podzim · bez roku',
    )
    expect(
      getIssueTitle({ ...issue, name: 'podzim', order: null, year: null }),
    ).toBe('podzim · bez roku a pořadí')
  })

  test('says what a draft without a name lacks', () => {
    expect(getIssueTitle({ ...issue, year: null })).toBe('Číslo bez roku')
    expect(getIssueTitle({ ...issue, order: null, year: null })).toBe(
      'Číslo bez roku a pořadí',
    )
    expect(getIssueTitle({ ...issue, order: null })).toBe(
      'Číslo 2026 bez pořadí',
    )
  })

  test('says what a supplement lacks without its number', () => {
    const supplement = { ...issue, supplement: 'Maturitní ples' }

    expect(getIssueTitle({ ...supplement, order: null })).toBe(
      'Maturitní ples · doplněk bez pořadí',
    )
    expect(getIssueTitle({ ...supplement, year: null })).toBe(
      'Maturitní ples · doplněk bez roku',
    )
    expect(getIssueTitle({ ...supplement, order: null, year: null })).toBe(
      'Maturitní ples · doplněk bez roku a pořadí',
    )
  })

  test("ignores the supplement's own name for the main issue", () => {
    expect(
      getIssueTitle({ ...issue, name: 'jaro', supplement: 'Maturitní ples' }),
    ).toBe('Maturitní ples · doplněk k číslu 4/2026')
  })
})
