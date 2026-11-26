import { describe, expect, test } from 'vitest'

import { parsePositiveIntegerParam } from '~/utils/parse-positive-integer-param'

const parse = (search: string) =>
  parsePositiveIntegerParam(new URLSearchParams(search), 'limit', 12)

describe('parsePositiveIntegerParam', () => {
  test('should return the fallback when the param is missing', () => {
    expect(parse('')).toBe(12)
  })

  test('should return a valid positive integer', () => {
    expect(parse('?limit=3')).toBe(3)
    expect(parse('?limit=24')).toBe(24)
  })

  test.each([
    ['empty', '?limit='],
    ['non-numeric', '?limit=abc'],
    ['fractional', '?limit=1.5'],
    ['negative', '?limit=-5'],
    ['zero', '?limit=0'],
    ['exponent', '?limit=1e2'],
    ['hexadecimal', '?limit=0x10'],
    ['padded', '?limit=%203'],
    ['past the safe range', '?limit=99999999999999999999'],
  ])('should return the fallback for a %s value', (_label, search) => {
    expect(parse(search)).toBe(12)
  })
})
