import { describe, expect, test } from 'vitest'

import { getIssueCoverAltText } from './get-issue-cover-alt-text'

const issue = { name: null, order: 4, supplement: null, year: 2026 }

describe('getIssueCoverAltText', () => {
  test('names the issue by its title', () => {
    expect(getIssueCoverAltText({ ...issue, name: 'podzim' })).toBe(
      'Obálka čísla podzim 2026',
    )
    expect(getIssueCoverAltText(issue)).toBe('Obálka čísla 4/2026')
  })

  test('names a supplement by its own name', () => {
    expect(
      getIssueCoverAltText({ ...issue, supplement: 'Maturitní ples' }),
    ).toBe('Obálka doplňku Maturitní ples')
  })
})
