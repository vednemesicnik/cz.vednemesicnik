import { describe, expect, test } from 'vitest'

import { formatNumericDateOrToday } from './format-numeric-date-or-today'

const now = new Date('2026-10-15T12:40:00.000Z')

describe('formatNumericDateOrToday', () => {
  test('today', () => {
    expect(
      formatNumericDateOrToday(new Date('2026-10-15T05:00:00.000Z'), now),
    ).toBe('dnes')
  })

  test('today in Prague though another day in UTC', () => {
    expect(
      formatNumericDateOrToday(new Date('2026-10-14T22:30:00.000Z'), now),
    ).toBe('dnes')
  })

  test('another day with its date', () => {
    expect(
      formatNumericDateOrToday(new Date('2026-09-25T07:05:00.000Z'), now),
    ).toBe('25. 9. 2026')
  })
})
