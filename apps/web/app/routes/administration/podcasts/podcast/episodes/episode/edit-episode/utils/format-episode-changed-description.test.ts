import { describe, expect, test } from 'vitest'

import { formatEpisodeChangedDescription } from './format-episode-changed-description'

const now = new Date('2026-10-27T14:40:00.000Z')
const savedAt = new Date('2026-10-27T13:31:00.000Z')

describe('formatEpisodeChangedDescription', () => {
  test('the last save and why nothing saved, without a short silence', () => {
    expect(
      formatEpisodeChangedDescription({
        awayMilliseconds: 30 * 1000,
        now,
        savedAt,
      }),
    ).toBe(
      'Poslední uložení z tohoto editoru dnes v 14:31. Změny z tohoto editoru se neuložily, aby nepřepsaly mezitím upravenou epizodu.',
    )
  })

  test('with the silence once it is a minute or more', () => {
    expect(
      formatEpisodeChangedDescription({
        awayMilliseconds: 14 * 60 * 1000,
        now,
        savedAt: null,
      }),
    ).toMatch(
      /^Z tohoto editoru zatím nebylo nic uloženo\. .* bez připojení\.$/,
    )
  })
})
