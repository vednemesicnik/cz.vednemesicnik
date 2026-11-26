import { describe, expect, test } from 'vitest'

import { getMomentOnDay } from './get-moment-on-day'

describe('getMomentOnDay', () => {
  test('moves the time of day to the chosen day', () => {
    const moment = getMomentOnDay('2026-09-28', new Date(2026, 9, 13, 14, 2, 7))

    expect([
      moment.getFullYear(),
      moment.getMonth(),
      moment.getDate(),
      moment.getHours(),
      moment.getMinutes(),
      moment.getSeconds(),
    ]).toEqual([2026, 8, 28, 14, 2, 7])
  })
})
