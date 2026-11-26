import { describe, expect, test } from 'vitest'

import { getPragueYear } from './get-prague-year'

describe('getPragueYear', () => {
  test('is the year of the moment', () => {
    expect(getPragueYear(new Date('2026-10-20T12:00:00Z'))).toBe(2026)
  })

  test("counts New Year's Eve after 23:00 UTC as the next year", () => {
    expect(getPragueYear(new Date('2026-12-31T23:30:00Z'))).toBe(2027)
  })
})
