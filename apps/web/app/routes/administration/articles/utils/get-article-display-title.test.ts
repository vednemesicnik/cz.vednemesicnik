import { describe, expect, test } from 'vitest'

import { getArticleDisplayTitle } from './get-article-display-title'

describe('getArticleDisplayTitle', () => {
  test('keeps a stored title', () => {
    expect(getArticleDisplayTitle('Deset knih na podzim')).toBe(
      'Deset knih na podzim',
    )
  })

  test('names a draft without a title Článek bez názvu', () => {
    expect(getArticleDisplayTitle('')).toBe('Článek bez názvu')
    expect(getArticleDisplayTitle('   ')).toBe('Článek bez názvu')
  })
})
