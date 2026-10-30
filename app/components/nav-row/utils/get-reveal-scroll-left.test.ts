import { describe, expect, test } from 'vitest'

import { getRevealScrollLeft } from './get-reveal-scroll-left'

const ROW = { clientWidth: 300, padding: 40 }

describe('getRevealScrollLeft', () => {
  test('leaves the row alone when the item is in view with its room', () => {
    expect(
      getRevealScrollLeft({
        ...ROW,
        itemEnd: 200,
        itemStart: 120,
        scrollLeft: 0,
      }),
    ).toBeNull()
  })

  test('scrolls back when the item is cut off at the start', () => {
    expect(
      getRevealScrollLeft({
        ...ROW,
        itemEnd: 380,
        itemStart: 300,
        scrollLeft: 320,
      }),
    ).toBe(260)
  })

  test('scrolls on when the item is cut off at the end', () => {
    expect(
      getRevealScrollLeft({
        ...ROW,
        itemEnd: 700,
        itemStart: 620,
        scrollLeft: 100,
      }),
    ).toBe(440)
  })

  test('never scrolls before the row start', () => {
    expect(
      getRevealScrollLeft({
        ...ROW,
        itemEnd: 80,
        itemStart: 10,
        scrollLeft: 50,
      }),
    ).toBe(0)
  })
})
