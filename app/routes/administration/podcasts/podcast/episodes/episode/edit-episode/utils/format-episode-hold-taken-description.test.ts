import { describe, expect, test } from 'vitest'

import { formatEpisodeHoldTakenDescription } from './format-episode-hold-taken-description'

const now = new Date('2026-10-27T14:40:00.000Z')
const savedAt = new Date('2026-10-27T13:31:00.000Z')

describe('formatEpisodeHoldTakenDescription', () => {
  test('all saved, with the last save', () => {
    expect(
      formatEpisodeHoldTakenDescription({ now, savedAt, unsentLabels: [] }),
    ).toEqual([
      'Všechny změny jsou uložené. Poslední uložení z tohoto editoru dnes v 14:31. Epizodu teď můžete jen číst.',
    ])
  })

  test('what did not save first, from an editor that never saved', () => {
    expect(
      formatEpisodeHoldTakenDescription({
        now,
        savedAt: null,
        unsentLabels: ['Popis', 'Odkazy na epizodu'],
      }),
    ).toEqual([
      'Některé změny nejsou uložené. Neuložené změny: Popis, Odkazy na epizodu.',
      'Z tohoto editoru zatím nebylo nic uloženo. Epizodu teď můžete jen číst.',
    ])
  })
})
