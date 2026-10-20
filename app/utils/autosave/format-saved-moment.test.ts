import { describe, expect, test } from 'vitest'

import { formatSavedMoment } from './format-saved-moment'

const now = new Date('2026-10-15T12:40:00.000Z')

describe('formatSavedMoment', () => {
  test('today', () => {
    expect(formatSavedMoment(new Date('2026-10-15T12:31:00.000Z'), now)).toBe(
      'dnes v 14:31',
    )
  })

  test('another day with its date', () => {
    expect(formatSavedMoment(new Date('2026-09-25T07:05:00.000Z'), now)).toBe(
      '25. 9. 2026 v 9:05',
    )
  })
})
