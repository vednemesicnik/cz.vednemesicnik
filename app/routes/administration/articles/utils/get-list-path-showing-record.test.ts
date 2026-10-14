import { describe, expect, test } from 'vitest'

import { getListPathShowingRecord } from './get-list-path-showing-record'

const record = {
  name: 'Školní ples',
  slug: 'skolni-ples',
  state: 'draft' as const,
}

describe('getListPathShowingRecord', () => {
  test('keeps the list when the new row matches its filters', () => {
    expect(
      getListPathShowingRecord('/categories?state=draft&q=ples', record),
    ).toBe('/categories?state=draft&q=ples')
  })

  test('drops the state filter that would hide the row', () => {
    expect(
      getListPathShowingRecord('/categories?state=published&sort=name', record),
    ).toBe('/categories?sort=name')
  })

  test('drops a search the name and address do not match', () => {
    expect(getListPathShowingRecord('/categories?q=sport&page=2', record)).toBe(
      '/categories?filter=none',
    )
  })

  test('matches the search ignoring letter case', () => {
    expect(getListPathShowingRecord('/categories?q=ŠKOLNÍ', record)).toBe(
      '/categories?q=ŠKOLNÍ',
    )
  })

  test('keeps a bare list', () => {
    expect(getListPathShowingRecord('/categories', record)).toBe('/categories')
  })
})
