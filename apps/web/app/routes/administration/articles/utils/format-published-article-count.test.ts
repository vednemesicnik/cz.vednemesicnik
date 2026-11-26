import { describe, expect, it } from 'vitest'

import { formatPublishedArticleCount } from './format-published-article-count'

describe('formatPublishedArticleCount', () => {
  it.each([
    [0, '0 publikovaných článků'],
    [1, '1 publikovaný článek'],
    [2, '2 publikované články'],
    [4, '4 publikované články'],
    [5, '5 publikovaných článků'],
    [18, '18 publikovaných článků'],
  ])('formats %i as "%s"', (count, expected) => {
    expect(formatPublishedArticleCount(count)).toBe(expected)
  })
})
