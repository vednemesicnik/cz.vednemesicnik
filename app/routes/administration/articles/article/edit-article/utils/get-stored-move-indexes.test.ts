import { describe, expect, test } from 'vitest'

import { getStoredMoveIndexes } from './get-stored-move-indexes'

describe('getStoredMoveIndexes', () => {
  test('moves among the stored images only', () => {
    expect(
      getStoredMoveIndexes(['a', 'b', 'c'], ['a', 'b', 'c'], 'a', 2),
    ).toEqual({ from: 0, to: 2 })
  })

  test('takes the place of the stored image it passes', () => {
    // A failed tile between them keeps its own place.
    expect(
      getStoredMoveIndexes(['a', 'failed', 'b', 'c'], ['a', 'b', 'c'], 'a', 1),
    ).toEqual({ from: 0, to: 2 })
    expect(
      getStoredMoveIndexes(
        ['a', 'b', 'processing', 'c'],
        ['a', 'b', 'c'],
        'c',
        0,
      ),
    ).toEqual({ from: 3, to: 0 })
  })

  test('moves nothing to its own place or out of range', () => {
    const ids = ['a', 'b']
    expect(getStoredMoveIndexes(ids, ids, 'a', 0)).toBeNull()
    expect(getStoredMoveIndexes(ids, ids, 'a', -1)).toBeNull()
    expect(getStoredMoveIndexes(ids, ids, 'a', 2)).toBeNull()
  })

  test('moves nothing that is not stored', () => {
    expect(
      getStoredMoveIndexes(['a', 'processing'], ['a'], 'processing', 0),
    ).toBeNull()
  })
})
