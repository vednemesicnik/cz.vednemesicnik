import { describe, expect, test } from 'vitest'

import { getIssueFixTarget } from './get-issue-fix-target'

const complete = {
  hasCover: true,
  hasPdf: true,
  isNumberTaken: false,
  order: 3,
  supplement: null,
  year: 2026,
}

describe('getIssueFixTarget', () => {
  test('a complete issue has nothing to fix', () => {
    expect(getIssueFixTarget(complete)).toBeNull()
  })

  test('each missing item maps to its field', () => {
    expect(getIssueFixTarget({ ...complete, year: null })).toBe('year')
    expect(getIssueFixTarget({ ...complete, order: null })).toBe('order')
    expect(getIssueFixTarget({ ...complete, hasCover: false })).toBe('cover')
    expect(getIssueFixTarget({ ...complete, hasPdf: false })).toBe('pdf')
  })

  test('the first missing item wins, in the order of the sentence', () => {
    expect(
      getIssueFixTarget({
        ...complete,
        hasCover: false,
        hasPdf: false,
        isNumberTaken: true,
      }),
    ).toBe('cover')
  })

  test('a taken number opens Pořadí v roce, a supplement’s Doplněk', () => {
    expect(getIssueFixTarget({ ...complete, isNumberTaken: true })).toBe(
      'order',
    )
    expect(
      getIssueFixTarget({
        ...complete,
        isNumberTaken: true,
        supplement: 'Maturitní ples',
      }),
    ).toBe('supplement')
  })
})
