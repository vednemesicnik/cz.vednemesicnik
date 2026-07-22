import { describe, expect, test } from 'vitest'

import { createFormattedDate, formatDate } from '~/utils/format-date'

describe('formatDate', () => {
  test('should return the null fallback for null', () => {
    expect(formatDate(null)).toBe('...')
  })

  test('should format in cs-CZ by default', () => {
    expect(formatDate(new Date('2026-07-01T10:00:00Z'))).toBe(
      '1. července 2026',
    )
  })

  test('should format in the given locale', () => {
    expect(formatDate(new Date('2026-07-01T10:00:00Z'), { locale: 'en' })).toBe(
      'July 1, 2026',
    )
  })

  test('should render the editorial day at the midnight boundary (Europe/Prague)', () => {
    // Backdated 1. 7. 00:00 CEST is stored as this UTC instant; in a UTC process
    // it must still read as 1. července, not 30. června.
    expect(formatDate(new Date('2026-06-30T22:00:00Z'))).toBe(
      '1. července 2026',
    )
  })
})

describe('createFormattedDate', () => {
  test('should return iso: null and the fallback for null', () => {
    expect(createFormattedDate(null)).toEqual({ formatted: '...', iso: null })
  })

  test('should return the ISO instant and the formatted display value', () => {
    expect(createFormattedDate(new Date('2026-06-30T22:00:00Z'))).toEqual({
      formatted: '1. července 2026',
      iso: '2026-06-30T22:00:00.000Z',
    })
  })
})
