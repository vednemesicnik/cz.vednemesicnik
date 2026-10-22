import { describe, expect, it } from 'vitest'

import { formatAuthorContentCounts } from './format-author-content-counts'

const NO_CONTENT = {
  articleCategories: 0,
  articles: 0,
  articleTags: 0,
  issues: 0,
  podcastEpisodes: 0,
  podcasts: 0,
}

describe('formatAuthorContentCounts', () => {
  // Intl.ListFormat keeps „a“ with the next word (a no-break space).
  it('names two kinds with „a“ (28g)', () => {
    expect(
      formatAuthorContentCounts({
        ...NO_CONTENT,
        articleCategories: 2,
        articles: 1,
      }),
    ).toBe('1 článku a\u00a02 rubrik')
  })

  it('names three kinds with a comma and „a“, in the 28g order', () => {
    expect(
      formatAuthorContentCounts({
        ...NO_CONTENT,
        articleCategories: 2,
        articles: 1,
        articleTags: 5,
      }),
    ).toBe('1 článku, 2 rubrik a\u00a05 štítků')
  })

  it.each([
    ['issues', 1, '1 čísla'],
    ['issues', 3, '3 čísel'],
    ['podcasts', 1, '1 podcastu'],
    ['podcastEpisodes', 1, '1 epizody'],
    ['podcastEpisodes', 12, '12 epizod'],
    ['articleTags', 1, '1 štítku'],
    ['articleCategories', 1, '1 rubriky'],
  ] as const)('formats %s × %i as „%s“', (type, count, expected) => {
    expect(formatAuthorContentCounts({ ...NO_CONTENT, [type]: count })).toBe(
      expected,
    )
  })

  it('is empty without content', () => {
    expect(formatAuthorContentCounts(NO_CONTENT)).toBe('')
  })
})
