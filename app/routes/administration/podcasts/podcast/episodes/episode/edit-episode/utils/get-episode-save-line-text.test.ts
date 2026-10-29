import { describe, expect, test } from 'vitest'

import { getEpisodeSaveLineText } from './get-episode-save-line-text'

const now = new Date('2026-10-20T14:40:00.000Z')
const savedAt = new Date('2026-10-20T12:02:00.000Z')

describe('getEpisodeSaveLineText', () => {
  test('a new draft before its first save', () => {
    expect(getEpisodeSaveLineText({ now, savedAt: null, status: 'idle' })).toBe(
      'Zatím neuloženo',
    )
  })

  test('the last save', () => {
    expect(getEpisodeSaveLineText({ now, savedAt, status: 'saved' })).toBe(
      'uloženo dnes v 14:02',
    )
  })

  test.each([
    ['pending', 'ukládá se'],
    ['saving', 'ukládá se'],
    ['offline', 'bez připojení · čeká na uložení'],
    ['failed', 'Nepodařilo se uložit.'],
  ] as const)('%s', (status, expected) => {
    expect(getEpisodeSaveLineText({ now, savedAt, status })).toBe(expected)
  })
})
