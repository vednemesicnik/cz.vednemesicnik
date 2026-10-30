import { describe, expect, test } from 'vitest'

import { getCurrentYear } from './get-current-year'

const YEARS = [2026, 2025, 2024, 2023]

describe('getCurrentYear', () => {
  test('is the first year at the top of the page', () => {
    expect(
      getCurrentYear({ isAtEnd: false, passedYears: new Set(), years: YEARS }),
    ).toBe(2026)
  })

  test('is the year whose heading passed under the bar last', () => {
    expect(
      getCurrentYear({
        isAtEnd: false,
        passedYears: new Set([2026, 2025]),
        years: YEARS,
      }),
    ).toBe(2025)
  })

  test('is the last year at the end of the page', () => {
    expect(
      getCurrentYear({
        isAtEnd: true,
        passedYears: new Set([2026, 2025]),
        years: YEARS,
      }),
    ).toBe(2023)
  })

  test('is nothing without years', () => {
    expect(
      getCurrentYear({ isAtEnd: false, passedYears: new Set(), years: [] }),
    ).toBeUndefined()
  })
})
