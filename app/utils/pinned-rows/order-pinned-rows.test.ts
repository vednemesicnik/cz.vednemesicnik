import { describe, expect, test } from 'vitest'

import { orderPinnedRows } from './order-pinned-rows'

describe('orderPinnedRows', () => {
  test('keeps the order on screen, not the order of the load', () => {
    const rows = [
      { id: 'c', title: 'C' },
      { id: 'a', title: 'A (changed)' },
      { id: 'b', title: 'B' },
    ]

    expect(orderPinnedRows(['a', 'b', 'c'], rows)).toEqual([
      { id: 'a', title: 'A (changed)' },
      { id: 'b', title: 'B' },
      { id: 'c', title: 'C' },
    ])
  })

  test('drops a row the load no longer returns', () => {
    expect(orderPinnedRows(['a', 'b'], [{ id: 'b' }])).toEqual([{ id: 'b' }])
  })

  test('adds no row that was not on screen', () => {
    expect(orderPinnedRows(['a'], [{ id: 'a' }, { id: 'new' }])).toEqual([
      { id: 'a' },
    ])
  })
})
