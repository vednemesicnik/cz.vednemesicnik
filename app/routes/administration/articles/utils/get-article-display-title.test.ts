import { describe, expect, test } from 'vitest'

import { getArticleDisplayTitle } from './get-article-display-title'

describe('getArticleDisplayTitle', () => {
  test('keeps a stored title', () => {
    expect(getArticleDisplayTitle('Deset knih na podzim')).toBe(
      'Deset knih na podzim',
    )
  })

  test('names a draft without a title Nový článek', () => {
    expect(getArticleDisplayTitle('')).toBe('Nový článek')
    expect(getArticleDisplayTitle('   ')).toBe('Nový článek')
  })
})
