import { describe, expect, test } from 'vitest'

import { isHalfVisibleBelow } from './is-half-visible-below'

const window = { bottom: 800, top: 64 }

describe('isHalfVisibleBelow', () => {
  test('holds for an image wholly in the open part of the window', () => {
    const rect = { bottom: 308, height: 108, top: 200 }

    expect(isHalfVisibleBelow({ ...window, rect })).toBe(true)
  })

  test('holds for an image exactly half under the header', () => {
    const rect = { bottom: 164, height: 200, top: -36 }

    expect(isHalfVisibleBelow({ ...window, rect })).toBe(true)
  })

  test('fails for an image mostly under the header', () => {
    const rect = { bottom: 100, height: 200, top: -100 }

    expect(isHalfVisibleBelow({ ...window, rect })).toBe(false)
  })

  test('fails for an image mostly below the window', () => {
    const rect = { bottom: 950, height: 200, top: 750 }

    expect(isHalfVisibleBelow({ ...window, rect })).toBe(false)
  })

  test('fails for an image with no height', () => {
    const rect = { bottom: 200, height: 0, top: 200 }

    expect(isHalfVisibleBelow({ ...window, rect })).toBe(false)
  })
})
