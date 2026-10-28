import { describe, expect, test } from 'vitest'

import { getPodcastSaveLineText } from './get-podcast-save-line-text'

const now = new Date('2026-10-28T14:40:00.000Z')
// 14:02 in Prague, on winter time since 25 October.
const savedAt = new Date('2026-10-28T13:02:00.000Z')

describe('getPodcastSaveLineText', () => {
  test('the last save, and the missing cover after it (27e)', () => {
    expect(
      getPodcastSaveLineText({
        hasCover: false,
        now,
        savedAt,
        status: 'saved',
      }),
    ).toBe('uloženo dnes v 14:02 · obálka zatím chybí')
    expect(
      getPodcastSaveLineText({ hasCover: true, now, savedAt, status: 'saved' }),
    ).toBe('uloženo dnes v 14:02')
  })

  test('a new draft before its first save', () => {
    expect(
      getPodcastSaveLineText({
        hasCover: false,
        now,
        savedAt: null,
        status: 'idle',
      }),
    ).toBe('Zatím neuloženo · obálka zatím chybí')
  })

  test.each([
    ['pending', 'ukládá se'],
    ['saving', 'ukládá se'],
    ['offline', 'bez připojení · čeká na uložení'],
    ['failed', 'Nepodařilo se uložit.'],
  ] as const)('%s says only that', (status, expected) => {
    expect(
      getPodcastSaveLineText({ hasCover: false, now, savedAt, status }),
    ).toBe(expected)
  })
})
