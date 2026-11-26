import { describe, expect, test, vi } from 'vitest'

import { getOrderMenuItems } from './get-order-menu-items'

const labels = (index: number, count: number) =>
  getOrderMenuItems(index, count, () => {}).map((item) => item.label)

describe('getOrderMenuItems', () => {
  test('offers nothing for a single row', () => {
    expect(labels(0, 1)).toEqual([])
  })

  test('offers only the step that changes something at the ends', () => {
    expect(labels(0, 2)).toEqual(['Posunout dolů'])
    expect(labels(1, 2)).toEqual(['Posunout nahoru'])
  })

  test('offers the ends only where they differ from one step', () => {
    expect(labels(0, 3)).toEqual(['Posunout dolů', 'Na konec'])
    expect(labels(1, 3)).toEqual(['Posunout nahoru', 'Posunout dolů'])
    expect(labels(2, 3)).toEqual(['Posunout nahoru', 'Na začátek'])
    expect(labels(2, 5)).toEqual([
      'Posunout nahoru',
      'Posunout dolů',
      'Na začátek',
      'Na konec',
    ])
  })

  test('moves the row to the chosen place', () => {
    const moveTo = vi.fn()
    const items = getOrderMenuItems(2, 5, moveTo)

    for (const item of items) item.onSelect()

    expect(moveTo.mock.calls).toEqual([[1], [3], [0], [4]])
  })
})
