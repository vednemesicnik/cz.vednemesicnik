import { describe, expect, test } from 'vitest'

import { formatAwayDuration } from './format-away-duration'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

describe('formatAwayDuration', () => {
  test.each([
    [30 * 1000, '1 minutu'],
    [3 * MINUTE, '3 minuty'],
    [14 * MINUTE, '14 minut'],
    [59.6 * MINUTE, '60 minut'],
    [60 * MINUTE, 'přibližně 1 hodinu'],
    [3 * HOUR, 'přibližně 3 hodiny'],
    [20 * HOUR, 'přibližně 20 hodin'],
    [47 * HOUR + 40 * MINUTE, 'přibližně 48 hodin'],
    [48 * HOUR, 'přibližně 2 dny'],
    [6 * 24 * HOUR, 'přibližně 6 dní'],
  ])('%i ms is „%s“', (milliseconds, expected) => {
    expect(formatAwayDuration(milliseconds)).toBe(expected)
  })
})
