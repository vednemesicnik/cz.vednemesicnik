import { describe, expect, test } from 'vitest'

import { formatIssueChangedDescription } from './format-issue-changed-description'

const now = new Date('2026-10-20T14:40:00.000Z')
const savedAt = new Date('2026-10-20T12:31:00.000Z')

describe('formatIssueChangedDescription', () => {
  test('the last save, what did not save and the silence', () => {
    expect(
      formatIssueChangedDescription({
        awayMilliseconds: 3 * 60 * 60 * 1000,
        now,
        savedAt,
      }),
    ).toBe(
      'Poslední uložení údajů z tohoto editoru dnes v 14:31. Změny údajů z tohoto editoru se neuložily, aby nepřepsaly mezitím upravené číslo. Editor byl přibližně 3 hodiny bez připojení.',
    )
  })

  test('leaves a silence under a minute out', () => {
    expect(
      formatIssueChangedDescription({
        awayMilliseconds: 20_000,
        now,
        savedAt: null,
      }),
    ).toBe(
      'Údaje z tohoto editoru zatím nebyly uloženy. Změny údajů z tohoto editoru se neuložily, aby nepřepsaly mezitím upravené číslo.',
    )
  })
})
