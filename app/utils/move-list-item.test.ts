import { describe, expect, test } from 'vitest'

import { moveListItem } from './move-list-item'

describe('moveListItem', () => {
  test('moves an item down', () => {
    expect(moveListItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
  })

  test('moves an item up', () => {
    expect(moveListItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })

  test('clamps the target to the list', () => {
    expect(moveListItem(['a', 'b'], 0, 5)).toEqual(['b', 'a'])
    expect(moveListItem(['a', 'b'], 1, -1)).toEqual(['b', 'a'])
  })

  test('does not mutate the input', () => {
    const items = ['a', 'b']
    moveListItem(items, 0, 1)
    expect(items).toEqual(['a', 'b'])
  })
})
