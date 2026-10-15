import { describe, expect, test } from 'vitest'

import { slugify } from '~/utils/slugify'

describe('slugify', () => {
  test('should convert string to lowercase', () => {
    expect(slugify('Example')).toBe('example')
  })

  test('should remove diacritics', () => {
    expect(slugify('éxámple')).toBe('example')
  })

  test('should replace spaces with hyphens', () => {
    expect(slugify('example test')).toBe('example-test')
  })

  test('should remove special characters except hyphens', () => {
    expect(slugify('example!@#-test')).toBe('example-test')
  })

  test('should handle a combination of transformations', () => {
    expect(slugify('Éxámple Test!@#')).toBe('example-test')
  })

  test('should turn separators between words into hyphens', () => {
    expect(slugify('2026/4')).toBe('2026-4')
    expect(slugify('Rozhovor: Jana Nováková')).toBe('rozhovor-jana-novakova')
    expect(slugify('v2.0')).toBe('v2-0')
  })

  test('should leave a valid slug as it is', () => {
    expect(slugify('2026-4')).toBe('2026-4')
  })
})
