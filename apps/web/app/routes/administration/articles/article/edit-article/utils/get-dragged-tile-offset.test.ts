import { describe, expect, test } from 'vitest'

import { getDraggedTileOffset } from './get-dragged-tile-offset'

const slot = { height: 300, left: 100, top: 100, width: 200 }
const bounds = { bottom: 1000, left: 0, right: 700, top: 50 }
const grab = { x: 20, y: 30 }

describe('getDraggedTileOffset', () => {
  test('keeps the tile under the pointer where it was taken hold of', () => {
    expect(
      getDraggedTileOffset({ bounds, grab, pointer: { x: 120, y: 130 }, slot }),
    ).toEqual({ x: 0, y: 0 })
    expect(
      getDraggedTileOffset({ bounds, grab, pointer: { x: 170, y: 90 }, slot }),
    ).toEqual({ x: 50, y: -40 })
  })

  test('keeps the tile inside the grid', () => {
    expect(
      getDraggedTileOffset({ bounds, grab, pointer: { x: 0, y: 0 }, slot }),
    ).toEqual({ x: -100, y: -50 })
    expect(
      getDraggedTileOffset({
        bounds,
        grab,
        pointer: { x: 2000, y: 2000 },
        slot,
      }),
    ).toEqual({ x: 400, y: 600 })
  })

  test('holds a tile wider than the grid at its start', () => {
    expect(
      getDraggedTileOffset({
        bounds: { bottom: 200, left: 0, right: 100, top: 0 },
        grab,
        pointer: { x: 500, y: 500 },
        slot: { height: 300, left: 0, top: 0, width: 200 },
      }),
    ).toEqual({ x: 0, y: 0 })
  })
})
