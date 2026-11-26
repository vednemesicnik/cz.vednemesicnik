import { describe, expect, it } from 'vitest'

import { parseCzechDate } from './parse-czech-date'

describe('parseCzechDate', () => {
  it.each([
    ['14. 5. 2009', '2009-05-14'],
    ['14.5.2009', '2009-05-14'],
    ['14.05.2009', '2009-05-14'],
    [' 1. 12. 1999 ', '1999-12-01'],
    ['29. 2. 2008', '2008-02-29'],
  ])('reads %s', (value, expected) => {
    expect(parseCzechDate(value)).toBe(expected)
  })

  it.each([
    '31. 4. 2009',
    '29. 2. 2009',
    '0. 5. 2009',
    '14. 13. 2009',
    '14. 5. 09',
    '14. 5. 0209',
    '2009-05-14',
    'včera',
    '',
  ])('refuses %s', (value) => {
    expect(parseCzechDate(value)).toBeNull()
  })
})
