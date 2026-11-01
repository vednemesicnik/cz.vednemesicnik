import { describe, expect, it } from 'vitest'

import { isMinorOnDate } from './is-minor-on-date'

describe('isMinorOnDate', () => {
  const noonOn = (day: string) => new Date(`${day}T12:00:00Z`)

  it('is a minor the day before the 18th birthday', () => {
    expect(isMinorOnDate('2008-11-02', noonOn('2026-11-01'))).toBe(true)
  })

  it('is an adult on the 18th birthday', () => {
    expect(isMinorOnDate('2008-11-01', noonOn('2026-11-01'))).toBe(false)
  })

  it('judges by the day in Prague', () => {
    // 23:30 UTC on 31 October is already 1 November in Prague.
    const lateInUtc = new Date('2026-10-31T23:30:00Z')
    expect(isMinorOnDate('2008-11-01', lateInUtc)).toBe(false)
  })

  it('turns someone born on 29 February adult on 1 March', () => {
    expect(isMinorOnDate('2008-02-29', noonOn('2026-02-28'))).toBe(true)
    expect(isMinorOnDate('2008-02-29', noonOn('2026-03-01'))).toBe(false)
  })
})
