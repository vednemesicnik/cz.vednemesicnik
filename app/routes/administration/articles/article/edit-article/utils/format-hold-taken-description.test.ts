import { describe, expect, test } from 'vitest'

import { formatHoldTakenDescription } from './format-hold-taken-description'

const now = new Date(2026, 9, 15, 14, 40)
const savedAt = new Date(2026, 9, 15, 14, 31)

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
