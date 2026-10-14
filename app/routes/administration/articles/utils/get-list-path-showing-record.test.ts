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
    ).toBe('/categories?sort=name&filter=none')
  })

  test('drops a search the name and address do not match', () => {
    expect(getListPathShowingRecord('/categories?q=sport&page=2', record)).toBe(
      '/categories?filter=none',
    )
  })

  test('matches the search ignoring the case of A–Z, as the list does', () => {
    expect(getListPathShowingRecord('/categories?q=PLES', record)).toBe(
      '/categories?q=PLES',
    )
  })

  test('drops a search that differs in the case of a Czech letter', () => {
    expect(getListPathShowingRecord('/categories?q=ŠKOLNÍ', record)).toBe(
      '/categories?filter=none',
    )
  })

  test('replaces the saved filter it came from', () => {
    expect(
      getListPathShowingRecord('/categories?state=published&filter=f1', record),
    ).toBe('/categories?filter=none')
  })

  test('keeps a bare list', () => {
    expect(getListPathShowingRecord('/categories', record)).toBe('/categories')
  })
})
