import { describe, expect, test } from 'vitest'

import { formatSavedMoment } from './format-saved-moment'

const now = new Date(2026, 9, 15, 14, 40)

describe('formatSavedMoment', () => {
  test('today', () => {
    expect(formatSavedMoment(new Date(2026, 9, 15, 14, 31), now)).toBe(
      'dnes v 14:31',
    )
  })

  test('another day with its date', () => {
    expect(formatSavedMoment(new Date(2026, 8, 25, 9, 5), now)).toBe(
      '25. 9. 2026 v 9:05',
    )
  })
})
