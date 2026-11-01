import { describe, expect, it } from 'vitest'

import { getPragueDate } from './get-prague-date'

describe('getPragueDate', () => {
  it('gives the day in Prague, not in UTC', () => {
    expect(getPragueDate(new Date('2026-06-14T22:30:00Z'))).toBe('2026-06-15')
    expect(getPragueDate(new Date('2026-06-14T21:30:00Z'))).toBe('2026-06-14')
  })

  it('pads the month and the day', () => {
    expect(getPragueDate(new Date('2026-01-05T12:00:00Z'))).toBe('2026-01-05')
  })
})
