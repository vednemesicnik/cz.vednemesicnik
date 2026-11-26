import { describe, expect, test } from 'vitest'

import { formatPodcastChangedDescription } from './format-podcast-changed-description'

const now = new Date('2026-10-28T14:40:00.000Z')
const savedAt = new Date('2026-10-28T13:31:00.000Z')

describe('formatPodcastChangedDescription', () => {
  test('the last save and why nothing saved, without a short silence', () => {
    expect(
      formatPodcastChangedDescription({
        awayMilliseconds: 30 * 1000,
        now,
        savedAt,
      }),
    ).toBe(
      'Poslední uložení z tohoto editoru dnes v 14:31. Změny z tohoto editoru se neuložily, aby nepřepsaly mezitím upravený podcast.',
    )
  })

  test('with the silence once it is a minute or more', () => {
    expect(
      formatPodcastChangedDescription({
        awayMilliseconds: 14 * 60 * 1000,
        now,
        savedAt: null,
      }),
    ).toMatch(
      /^Z tohoto editoru zatím nebylo nic uloženo\. .* bez připojení\.$/,
    )
  })
})
