import { describe, expect, test } from 'vitest'

import { getIssueNumberSuggestion } from './get-issue-number-suggestion'

const base = {
  currentYear: 2026,
  order: '',
  supplement: '',
  takenOrdersByYear: { 2019: [1, 2], 2026: [1, 2, 4] },
  year: '',
}

describe('getIssueNumberSuggestion', () => {
  test('offers this year and its next free order for an empty number', () => {
    expect(getIssueNumberSuggestion(base)).toEqual({ order: 5, year: 2026 })
  })

  test('offers the first order in a year without issues', () => {
    expect(getIssueNumberSuggestion({ ...base, currentYear: 2027 })).toEqual({
      order: 1,
      year: 2027,
    })
  })

  test('offers the next free order of the year typed', () => {
    expect(getIssueNumberSuggestion({ ...base, year: '2019' })).toEqual({
      order: 3,
      year: null,
    })
  })

  test('offers nothing for a year it cannot read', () => {
    expect(getIssueNumberSuggestion({ ...base, year: 'abc' })).toBeNull()
  })

  test('offers this year for an order typed alone', () => {
    expect(getIssueNumberSuggestion({ ...base, order: '3' })).toEqual({
      order: null,
      year: 2026,
    })
  })

  test('offers nothing once both are filled', () => {
    expect(
      getIssueNumberSuggestion({ ...base, order: '3', year: '2026' }),
    ).toBeNull()
  })

  test('offers nothing for a supplement', () => {
    expect(
      getIssueNumberSuggestion({ ...base, supplement: 'Maturitní ples' }),
    ).toBeNull()
  })

  test('treats a field of spaces as empty', () => {
    expect(getIssueNumberSuggestion({ ...base, year: '  ' })).toEqual({
      order: 5,
      year: 2026,
    })
  })
})
