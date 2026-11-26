import { describe, expect, test } from 'vitest'

import { formatTime } from './format-time'

describe('formatTime', () => {
  test('writes the time in Prague, summer and winter', () => {
    expect(formatTime(new Date('2026-10-12T12:35:00.000Z'))).toBe('14:35')
    expect(formatTime(new Date('2026-02-03T07:03:00.000Z'))).toBe('8:03')
  })
})
