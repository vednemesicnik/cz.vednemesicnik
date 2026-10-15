import { describe, expect, test } from 'vitest'

import { formatArticleChangedDescription } from './format-article-changed-description'

const now = new Date(2026, 9, 15, 14, 40)
const savedAt = new Date(2026, 9, 15, 14, 20)

describe('formatArticleChangedDescription', () => {
  test('says how long the editor was away', () => {
    expect(
      formatArticleChangedDescription({
        awayMilliseconds: 14 * 60 * 1000,
        now,
        savedAt,
      }),
    ).toBe(
      'Editor byl 14 minut bez připojení. Poslední uložení dnes v 14:20. Novější změny z tohoto editoru se neuložily, aby nepřepsaly mezitím upravený článek.',
    )
  })

  test('under a minute it does not claim a lost connection', () => {
    expect(
      formatArticleChangedDescription({
        awayMilliseconds: 20 * 1000,
        now,
        savedAt,
      }),
    ).toBe(
      'Poslední uložení dnes v 14:20. Novější změny z tohoto editoru se neuložily, aby nepřepsaly mezitím upravený článek.',
    )
  })
})
