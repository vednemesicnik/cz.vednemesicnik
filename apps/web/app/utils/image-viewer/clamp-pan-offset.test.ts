import { describe, expect, test } from 'vitest'

import { clampPanOffset } from './clamp-pan-offset'

const area = { height: 600, width: 400 }

describe('clampPanOffset', () => {
  test('keeps an offset that leaves no edge inside the area', () => {
    const photo = { height: 300, width: 400 }

    expect(clampPanOffset({ x: 150, y: 0 }, 2, photo, area)).toEqual({
      x: 150,
      y: 0,
    })
  })

  test('stops at the edge of the scaled photo', () => {
    const photo = { height: 300, width: 400 }

    // 800 wide over 400: 200 either way.
    expect(clampPanOffset({ x: 500, y: 0 }, 2, photo, area).x).toBe(200)
    expect(clampPanOffset({ x: -500, y: 0 }, 2, photo, area).x).toBe(-200)
  })

  test('holds an axis still where the scaled photo fits the area', () => {
    const photo = { height: 300, width: 400 }

    // 600 high over 600: no room to move.
    expect(clampPanOffset({ x: 0, y: 80 }, 2, photo, area).y).toBe(0)
  })

  test('holds the whole photo in the middle', () => {
    const photo = { height: 300, width: 400 }

    expect(clampPanOffset({ x: 40, y: -40 }, 1, photo, area)).toEqual({
      x: 0,
      y: 0,
    })
  })
})
