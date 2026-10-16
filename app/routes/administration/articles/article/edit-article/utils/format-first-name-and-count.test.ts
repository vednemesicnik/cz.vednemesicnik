import { describe, expect, it } from 'vitest'

import { formatFirstNameAndCount } from './format-first-name-and-count'

describe('formatFirstNameAndCount', () => {
  it('names the first and counts the rest (24f)', () => {
    expect(
      formatFirstNameAndCount(['Kultura', 'Doporučujeme', 'Knihovna']),
    ).toBe('Kultura +2')
  })

  it('names a single one alone', () => {
    expect(formatFirstNameAndCount(['Kultura'])).toBe('Kultura')
  })

  it('is a dash without any, as on the detail (23a)', () => {
    expect(formatFirstNameAndCount([])).toBe('—')
  })
})
