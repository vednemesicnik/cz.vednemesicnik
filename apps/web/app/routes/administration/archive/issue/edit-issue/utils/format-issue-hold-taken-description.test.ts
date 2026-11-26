import { describe, expect, test } from 'vitest'

import { formatIssueHoldTakenDescription } from './format-issue-hold-taken-description'

const now = new Date('2026-10-20T14:40:00.000Z')
const savedAt = new Date('2026-10-20T12:31:00.000Z')

describe('formatIssueHoldTakenDescription', () => {
  test('all saved, with the last save', () => {
    expect(
      formatIssueHoldTakenDescription({ now, savedAt, unsentLabels: [] }),
    ).toEqual([
      'Všechny změny údajů jsou uložené. Poslední uložení údajů z tohoto editoru dnes v 14:31. Číslo teď můžete jen číst.',
    ])
  })

  test('what did not save first, from an editor that never saved', () => {
    expect(
      formatIssueHoldTakenDescription({
        now,
        savedAt: null,
        unsentLabels: ['Název', 'Doplněk'],
      }),
    ).toEqual([
      'Některé změny údajů se nestihly uložit. Neuložené změny: Název, Doplněk.',
      'Údaje z tohoto editoru zatím nebyly uloženy. Číslo teď můžete jen číst.',
    ])
  })
})
