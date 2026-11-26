import { describe, expect, test } from 'vitest'

import { orderFilteredFirst } from './order-filtered-first'

const items = [
  { name: 'Kultura', slug: 'kultura' },
  { name: 'Rozhovor', slug: 'rozhovor' },
  { name: 'Škola', slug: 'skola' },
]

describe('orderFilteredFirst', () => {
  test('keeps the order without a filter', () => {
    expect(orderFilteredFirst(items, undefined)).toEqual([
      'Kultura',
      'Rozhovor',
      'Škola',
    ])
  })

  test('puts the filtered ones first, each part in its order', () => {
    expect(orderFilteredFirst(items, ['skola', 'rozhovor'])).toEqual([
      'Rozhovor',
      'Škola',
      'Kultura',
    ])
  })

  test('ignores a filtered slug the row does not have', () => {
    expect(orderFilteredFirst(items, ['sport'])).toEqual([
      'Kultura',
      'Rozhovor',
      'Škola',
    ])
  })

  test('returns nothing for no items', () => {
    expect(orderFilteredFirst([], ['kultura'])).toEqual([])
  })
})
