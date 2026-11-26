import { describe, expect, test } from 'vitest'

import { getAuthorContentCounts } from './get-author-content-counts'

const NONE = {
  articleCategories: 0,
  articles: 0,
  articleTags: 0,
  issues: 0,
  podcastEpisodes: 0,
  podcasts: 0,
}

describe('getAuthorContentCounts', () => {
  test("names the counts in the line's order, by plural", () => {
    expect(
      getAuthorContentCounts({
        articleCategories: 1,
        articles: 52,
        articleTags: 2,
        issues: 3,
        podcastEpisodes: 9,
        podcasts: 1,
      }),
    ).toEqual([
      { label: '52 článků', type: 'articles' },
      { label: '9 epizod', type: 'podcastEpisodes' },
      { label: '3 čísla', type: 'issues' },
      { label: '1 podcast', type: 'podcasts' },
      { label: '1 rubrika', type: 'articleCategories' },
      { label: '2 štítky', type: 'articleTags' },
    ])
  })

  test('leaves out what the author has none of', () => {
    expect(getAuthorContentCounts({ ...NONE, articles: 1 })).toEqual([
      { label: '1 článek', type: 'articles' },
    ])
  })

  test('is empty for an author on nothing', () => {
    expect(getAuthorContentCounts(NONE)).toEqual([])
  })
})
