import { describe, expect, it } from 'vitest'
import { formatArticleCount } from './format-article-count'

describe('formatArticleCount', () => {
  it.each([
    [0, '0 článků'],
    [1, '1 článek'],
    [2, '2 články'],
    [4, '4 články'],
    [5, '5 článků'],
    [18, '18 článků'],
    [22, '22 článků'],
  ])('formats %i as "%s"', (count, expected) => {
    expect(formatArticleCount(count)).toBe(expected)
  })

  it('groups thousands the Czech way', () => {
    expect(formatArticleCount(1200)).toBe('1 200 článků')
  })
})
