import { describe, expect, test } from 'vitest'

import { formatHoldTakenDescription } from './format-hold-taken-description'

const now = new Date('2026-10-15T12:40:00.000Z')
const savedAt = new Date('2026-10-15T12:31:00.000Z')

describe('formatHoldTakenDescription', () => {
  test('nothing waited', () => {
    expect(
      formatHoldTakenDescription({ hasUnsentChanges: false, now, savedAt }),
    ).toBe(
      'Všechny změny jsou uložené. Poslední uložení dnes v 14:31. Článek teď můžete jen číst.',
    )
  })

  test('something did not make it', () => {
    expect(
      formatHoldTakenDescription({ hasUnsentChanges: true, now, savedAt }),
    ).toBe(
      'Některé změny se nestihly uložit. Poslední uložení dnes v 14:31. Článek teď můžete jen číst.',
    )
  })
})
