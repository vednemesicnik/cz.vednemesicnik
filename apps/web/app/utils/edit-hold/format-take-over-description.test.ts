import { describe, expect, test } from 'vitest'

import { formatTakeOverDescription } from './format-take-over-description'

const now = new Date('2026-10-15T14:40:00.000Z')
const ending =
  'Po převzetí bude původní editor jen ke čtení. Neuložené změny se mohou ztratit.'

describe('formatTakeOverDescription', () => {
  test('who, since when and the last save, today (24g)', () => {
    expect(
      formatTakeOverDescription(
        {
          lastSavedAt: '2026-10-15T12:31:00.000Z',
          name: 'Jakub Novák',
          since: '2026-10-15T12:02:00.000Z',
        },
        now,
      ),
    ).toBe(
      `Článek upravuje Jakub Novák od 14:02. Poslední uložení dnes v 14:31. ${ending}`,
    )
  })

  test('an earlier day with its date', () => {
    expect(
      formatTakeOverDescription(
        {
          lastSavedAt: '2026-09-25T12:02:00.000Z',
          name: 'Jakub Novák',
          since: '2026-10-14T21:50:00.000Z',
        },
        now,
      ),
    ).toBe(
      `Článek upravuje Jakub Novák od 14. 10. 2026 v 23:50. Poslední uložení 25. 9. 2026 v 14:02. ${ending}`,
    )
  })

  test('names an issue', () => {
    expect(
      formatTakeOverDescription(
        {
          lastSavedAt: '2026-10-15T12:31:00.000Z',
          name: 'Jakub Novák',
          since: '2026-10-15T12:02:00.000Z',
        },
        now,
        'issue',
      ),
    ).toBe(
      `Číslo upravuje Jakub Novák od 14:02. Poslední uložení dnes v 14:31. ${ending}`,
    )
  })
})
