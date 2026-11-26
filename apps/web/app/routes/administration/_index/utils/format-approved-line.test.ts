import { describe, expect, test } from 'vitest'

import { formatApprovedLine } from './format-approved-line'

const earliestApprovedAt = new Date('2026-09-24T10:00:00Z')

describe('formatApprovedLine', () => {
  test('several pieces say the earliest approval', () => {
    expect(
      formatApprovedLine({ count: 3, earliestApprovedAt, type: 'article' }),
    ).toBe('3 články · nejdřívější schválení 24. 9. 2026')
    expect(
      formatApprovedLine({ count: 5, earliestApprovedAt, type: 'issue' }),
    ).toBe('5 čísel · nejdřívější schválení 24. 9. 2026')
  })

  test('one piece says its approval in the noun’s gender', () => {
    expect(
      formatApprovedLine({ count: 1, earliestApprovedAt, type: 'episode' }),
    ).toBe('1 epizoda, schválená 24. 9. 2026')
    expect(
      formatApprovedLine({ count: 1, earliestApprovedAt, type: 'issue' }),
    ).toBe('1 číslo, schválené 24. 9. 2026')
    expect(
      formatApprovedLine({ count: 1, earliestApprovedAt, type: 'tag' }),
    ).toBe('1 štítek, schválený 24. 9. 2026')
  })
})
