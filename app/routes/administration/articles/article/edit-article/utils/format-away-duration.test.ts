import { describe, expect, test } from 'vitest'

import { formatAwayDuration } from './format-away-duration'

const MINUTE = 60 * 1000

describe('formatAwayDuration', () => {
  test.each([
    [30 * 1000, '1 minutu'],
    [3 * MINUTE, '3 minuty'],
    [14 * MINUTE, '14 minut'],
    [59 * MINUTE, '59 minut'],
    [60 * MINUTE, '1 hodinu'],
    [3 * 60 * MINUTE, '3 hodiny'],
    [20 * 60 * MINUTE, '20 hodin'],
    [48 * 60 * MINUTE, '2 dny'],
    [6 * 24 * 60 * MINUTE, '6 dní'],
  ])('%i ms is „%s“', (milliseconds, expected) => {
    expect(formatAwayDuration(milliseconds)).toBe(expected)
  })
})
