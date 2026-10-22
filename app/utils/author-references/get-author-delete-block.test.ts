import { describe, expect, it } from 'vitest'

import { getAuthorDeleteBlock } from './get-author-delete-block'

const NO_REFERENCES = {
  articleCategories: 0,
  articles: 0,
  articleTags: 0,
  issues: 0,
  podcastEpisodes: 0,
  podcasts: 0,
  reviews: 0,
}

const author = (
  counts: Partial<typeof NO_REFERENCES> = {},
  user: { id: string } | null = null,
) => ({ _count: { ...NO_REFERENCES, ...counts }, user })

describe('getAuthorDeleteBlock', () => {
  it('lets a guest author with nothing on it be deleted', () => {
    expect(getAuthorDeleteBlock(author())).toEqual({
      contentCounts: {
        articleCategories: 0,
        articles: 0,
        articleTags: 0,
        issues: 0,
        podcastEpisodes: 0,
        podcasts: 0,
      },
      deletable: true,
      hasAccount: false,
      hasApprovals: false,
    })
  })

  it('holds an author who stands only on articles', () => {
    const block = getAuthorDeleteBlock(author({ articles: 2 }))

    expect(block.deletable).toBe(false)
    expect(block.contentCounts.articles).toBe(2)
    expect(block.hasApprovals).toBe(false)
  })

  it('holds an author a category references', () => {
    const block = getAuthorDeleteBlock(author({ articleCategories: 1 }))

    expect(block.deletable).toBe(false)
    expect(block.contentCounts.articleCategories).toBe(1)
  })

  it('holds an author who only gave approvals', () => {
    const block = getAuthorDeleteBlock(author({ reviews: 3 }))

    expect(block.deletable).toBe(false)
    expect(block.hasApprovals).toBe(true)
    expect(
      Object.values(block.contentCounts).every((count) => count === 0),
    ).toBe(true)
  })

  it('holds an author with an account', () => {
    const block = getAuthorDeleteBlock(author({}, { id: 'user-1' }))

    expect(block.deletable).toBe(false)
    expect(block.hasAccount).toBe(true)
  })
})
