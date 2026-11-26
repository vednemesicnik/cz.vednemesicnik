import { describe, expect, test } from 'vitest'

import { findTileAtPoint } from './find-tile-at-point'

const tiles = [
  { box: { height: 300, left: 0, top: 0, width: 200 }, id: 'a' },
  { box: { height: 280, left: 220, top: 0, width: 200 }, id: 'b' },
  { box: { height: 300, left: 0, top: 324, width: 200 }, id: 'c' },
]

describe('findTileAtPoint', () => {
  test('finds the tile under the point', () => {
    expect(findTileAtPoint(tiles, 10, 10)).toBe('a')
    expect(findTileAtPoint(tiles, 300, 100)).toBe('b')
    expect(findTileAtPoint(tiles, 199, 600)).toBe('c')
  })

  test('finds nothing in a gap', () => {
    // Between the columns, and under the shorter tile.
    expect(findTileAtPoint(tiles, 210, 100)).toBeNull()
    expect(findTileAtPoint(tiles, 300, 290)).toBeNull()
  })

  test('finds nothing outside the grid', () => {
    expect(findTileAtPoint(tiles, -1, 10)).toBeNull()
    expect(findTileAtPoint(tiles, 500, 10)).toBeNull()
  })
})
