import { describe, expect, test } from 'vitest'

import { getEdgeScrollSpeed } from './get-edge-scroll-speed'

const box = { edge: 40, end: 500, max: 12, start: 100 }

describe('getEdgeScrollSpeed', () => {
  test('does not scroll outside the bands', () => {
    expect(getEdgeScrollSpeed({ ...box, pointer: 300 })).toBe(0)
    expect(getEdgeScrollSpeed({ ...box, pointer: 140 })).toBe(0)
    expect(getEdgeScrollSpeed({ ...box, pointer: 460 })).toBe(0)
  })

  test('scrolls towards the start, faster deeper in the band', () => {
    expect(getEdgeScrollSpeed({ ...box, pointer: 120 })).toBe(-6)
    expect(getEdgeScrollSpeed({ ...box, pointer: 100 })).toBe(-12)
  })

  test('scrolls towards the end, faster deeper in the band', () => {
    expect(getEdgeScrollSpeed({ ...box, pointer: 480 })).toBe(6)
    expect(getEdgeScrollSpeed({ ...box, pointer: 500 })).toBe(12)
  })

  test('caps the speed past the edge', () => {
    expect(getEdgeScrollSpeed({ ...box, pointer: 20 })).toBe(-12)
    expect(getEdgeScrollSpeed({ ...box, pointer: 700 })).toBe(12)
  })
})
