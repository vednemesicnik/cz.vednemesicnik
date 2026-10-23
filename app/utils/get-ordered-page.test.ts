import { describe, expect, test } from 'vitest'

import { getOrderedPage } from './get-ordered-page'
import { nameCollator } from './name-collator'

const records = ['zima', 'Šťastný', 'Říha', 'adam', 'Beneš'].map((name) => ({
  id: name,
  name,
}))

const byName = (first: { name: string }, second: { name: string }) =>
  nameCollator.compare(first.name, second.name)

describe('getOrderedPage', () => {
  test('orders by the given comparator', () => {
    expect(getOrderedPage(records, byName, { page: 1, pageSize: 20 })).toEqual({
      pageIds: ['adam', 'Beneš', 'Říha', 'Šťastný', 'zima'],
      totalCount: 5,
    })
  })

  test('returns the requested page and the total', () => {
    expect(getOrderedPage(records, byName, { page: 2, pageSize: 2 })).toEqual({
      pageIds: ['Říha', 'Šťastný'],
      totalCount: 5,
    })
  })

  test('is empty past the last page', () => {
    expect(
      getOrderedPage(records, byName, { page: 4, pageSize: 2 }).pageIds,
    ).toEqual([])
  })

  test('leaves the records as they were', () => {
    getOrderedPage(records, byName, { page: 1, pageSize: 20 })

    expect(records.map((record) => record.id)).toEqual([
      'zima',
      'Šťastný',
      'Říha',
      'adam',
      'Beneš',
    ])
  })
})
