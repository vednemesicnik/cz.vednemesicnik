import { describe, expect, test } from 'vitest'

import { toLocalDayValue } from './to-local-day-value'

describe('toLocalDayValue', () => {
  test('pads the month and the day', () => {
    expect(toLocalDayValue(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})
