import { describe, expect, test } from 'vitest'

import { isNameTaken } from './is-name-taken'

describe('isNameTaken', () => {
  test('ignores letter case', () => {
    expect(isNameTaken('Maturita', ['maturita'])).toBe(true)
  })

  test('ignores the case of Czech letters', () => {
    expect(isNameTaken('ŠKOLA', ['škola'])).toBe(true)
  })

  test('keeps diacritics apart', () => {
    expect(isNameTaken('skola', ['škola'])).toBe(false)
  })

  test('is false for a free name', () => {
    expect(isNameTaken('Sport', ['Kultura', 'Věda'])).toBe(false)
  })
})
