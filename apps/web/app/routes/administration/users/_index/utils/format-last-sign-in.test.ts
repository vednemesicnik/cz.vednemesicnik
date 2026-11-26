import { describe, expect, it } from 'vitest'

import { formatLastSignIn } from './format-last-sign-in'

const now = new Date('2026-10-25T12:00:00')

describe('formatLastSignIn', () => {
  it('formats an earlier day as its date', () => {
    expect(
      formatLastSignIn(
        { at: new Date('2026-09-25T08:00:00'), kind: 'date' },
        now,
      ),
    ).toBe('25. 9. 2026')
  })

  it('formats today as „dnes“', () => {
    expect(
      formatLastSignIn(
        { at: new Date('2026-10-25T08:00:00'), kind: 'date' },
        now,
      ),
    ).toBe('dnes')
  })

  it('says an invitation is still waiting', () => {
    expect(formatLastSignIn({ kind: 'never' }, now)).toBe('zatím nikdy')
  })

  it('says no sign-in within the retention window', () => {
    expect(formatLastSignIn({ kind: 'not-within-retention' }, now)).toBe(
      '90 dní bez přihlášení',
    )
  })
})
