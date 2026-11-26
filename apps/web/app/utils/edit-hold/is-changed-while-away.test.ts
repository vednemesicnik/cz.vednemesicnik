import { describe, expect, test } from 'vitest'

import { isChangedWhileAway } from './is-changed-while-away'

const holder = {
  lastSavedAt: '2026-10-15T12:20:00.000Z',
  name: 'Marie Horáková',
  since: '2026-10-15T12:10:00.000Z',
}

const MINUTE = 60 * 1000

describe('isChangedWhileAway', () => {
  test('saved meanwhile while the editor was silent past the hold: 24i', () => {
    expect(
      isChangedWhileAway({
        awayMilliseconds: 14 * MINUTE,
        holder,
        ownLastSavedAt: '2026-10-15T12:05:00.000Z',
      }),
    ).toBe(true)
  })

  test('nothing saved since its own last save: 24h', () => {
    expect(
      isChangedWhileAway({
        awayMilliseconds: 14 * MINUTE,
        holder,
        ownLastSavedAt: '2026-10-15T12:20:00.000Z',
      }),
    ).toBe(false)
  })

  test('a takeover heard of at once is 24h, even after a save', () => {
    expect(
      isChangedWhileAway({
        awayMilliseconds: 30 * 1000,
        holder,
        ownLastSavedAt: '2026-10-15T12:05:00.000Z',
      }),
    ).toBe(false)
  })
})
