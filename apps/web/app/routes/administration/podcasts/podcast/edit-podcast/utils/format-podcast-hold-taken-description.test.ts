import { describe, expect, test } from 'vitest'

import { formatPodcastHoldTakenDescription } from './format-podcast-hold-taken-description'

const now = new Date('2026-10-28T14:40:00.000Z')
const savedAt = new Date('2026-10-28T13:31:00.000Z')

describe('formatPodcastHoldTakenDescription', () => {
  test('everything saved, in one paragraph', () => {
    expect(
      formatPodcastHoldTakenDescription({ now, savedAt, unsentLabels: [] }),
    ).toEqual([
      'Všechny změny jsou uložené. Poslední uložení z tohoto editoru dnes v 14:31. Podcast teď můžete jen číst.',
    ])
  })

  test('names what is not saved, the cover included (copy utgh1hb7)', () => {
    expect(
      formatPodcastHoldTakenDescription({
        now,
        savedAt: null,
        unsentLabels: ['Popis', 'Obálka'],
      }),
    ).toEqual([
      'Některé změny nejsou uložené. Neuložené změny: Popis, Obálka.',
      'Z tohoto editoru zatím nebylo nic uloženo. Podcast teď můžete jen číst.',
    ])
  })
})
