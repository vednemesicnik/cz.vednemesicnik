import { describe, expect, test } from 'vitest'

import { shouldCloseOnRelease } from './should-close-on-release'

describe('shouldCloseOnRelease', () => {
  test('closes past the distance', () => {
    expect(shouldCloseOnRelease({ distance: 121, velocity: 0 })).toBe(true)
  })

  test('springs back at the distance or short of it, released slowly', () => {
    expect(shouldCloseOnRelease({ distance: 120, velocity: 0.2 })).toBe(false)
    expect(shouldCloseOnRelease({ distance: 40, velocity: 0 })).toBe(false)
  })

  test('closes on a flick down, however short', () => {
    expect(shouldCloseOnRelease({ distance: 30, velocity: 0.8 })).toBe(true)
  })

  test('does not close a finger moving back up', () => {
    expect(shouldCloseOnRelease({ distance: 60, velocity: -1 })).toBe(false)
  })

  test('does not close without a drag down', () => {
    expect(shouldCloseOnRelease({ distance: 0, velocity: 2 })).toBe(false)
  })
})
