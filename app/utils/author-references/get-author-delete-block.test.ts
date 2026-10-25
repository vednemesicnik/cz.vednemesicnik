import type { UserRoleName } from '@generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { getAuthorDeleteBlock } from './get-author-delete-block'

const NO_REFERENCES = {
  articleCategories: 0,
  articles: 0,
  articleTags: 0,
  contentLogs: 0,
  issues: 0,
  podcastEpisodes: 0,
  podcasts: 0,
  reviews: 0,
}

const VIEWER_ID = 'viewer'

const author = (
  counts: Partial<typeof NO_REFERENCES> = {},
  user: { id: string; role: { name: UserRoleName } } | null = null,
) => ({ _count: { ...NO_REFERENCES, ...counts }, user })

const account = (id: string, role: UserRoleName = 'member') => ({
  id,
  role: { name: role },
})

describe('getAuthorDeleteBlock', () => {
  it('lets a guest author with nothing on it be deleted', () => {
    expect(getAuthorDeleteBlock(author(), VIEWER_ID)).toEqual({
      account: 'none',
      contentCounts: {
        articleCategories: 0,
        articles: 0,
        articleTags: 0,
        issues: 0,
        podcastEpisodes: 0,
        podcasts: 0,
      },
      deletable: true,
      hasApprovals: false,
      hasHistory: false,
    })
  })

  it('holds an author who stands only on articles', () => {
    const block = getAuthorDeleteBlock(author({ articles: 2 }), VIEWER_ID)

    expect(block.deletable).toBe(false)
    expect(block.contentCounts.articles).toBe(2)
    expect(block.hasApprovals).toBe(false)
  })

  it('holds an author a category references', () => {
    const block = getAuthorDeleteBlock(
      author({ articleCategories: 1 }),
      VIEWER_ID,
    )

    expect(block.deletable).toBe(false)
    expect(block.contentCounts.articleCategories).toBe(1)
  })

  it('holds an author who only gave approvals', () => {
    const block = getAuthorDeleteBlock(author({ reviews: 3 }), VIEWER_ID)

    expect(block.deletable).toBe(false)
    expect(block.hasApprovals).toBe(true)
    expect(
      Object.values(block.contentCounts).every((count) => count === 0),
    ).toBe(true)
  })

  it('holds an author who stands only in content history', () => {
    const block = getAuthorDeleteBlock(author({ contentLogs: 4 }), VIEWER_ID)

    expect(block.deletable).toBe(false)
    expect(block.hasHistory).toBe(true)
    expect(block.hasApprovals).toBe(false)
    expect(
      Object.values(block.contentCounts).every((count) => count === 0),
    ).toBe(true)
  })

  it('holds an author with an account that can be deleted first', () => {
    const block = getAuthorDeleteBlock(author({}, account('user-1')), VIEWER_ID)

    expect(block.deletable).toBe(false)
    expect(block.account).toBe('deletable')
  })

  it('tells the Owner’s account apart, even for the Owner looking', () => {
    expect(
      getAuthorDeleteBlock(author({}, account(VIEWER_ID, 'owner')), VIEWER_ID)
        .account,
    ).toBe('owner')
  })

  it('tells the viewer’s own account apart', () => {
    expect(
      getAuthorDeleteBlock(author({}, account(VIEWER_ID)), VIEWER_ID).account,
    ).toBe('own')
  })
})
