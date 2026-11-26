import { describe, expect, test } from 'vitest'

import { foldForSearch } from './fold-for-search'

describe('foldForSearch', () => {
  test('drops case and diacritics', () => {
    expect(foldForSearch('Přijímačky ŠKOLA')).toBe('prijimacky skola')
  })
})
