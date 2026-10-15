import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getTaxonomyArticleSummary } from './get-taxonomy-article-summary.server'

const mocks = vi.hoisted(() => ({
  articleCount: vi.fn(),
  articleFindMany: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    article: { count: mocks.articleCount, findMany: mocks.articleFindMany },
  },
}))

type Context = Parameters<typeof getTaxonomyArticleSummary>[0]

// A Contributor: their own articles only, in every state.
const contributor: Context = {
  authorId: 'author-1',
  can: (() => ({
    hasAny: false,
    hasOwn: true,
    hasPermission: true,
  })) as Context['can'],
}

const relationWhere = { categories: { some: { id: 'category-1' } } }
const mine = { authors: { some: { id: 'author-1' } } }
const permissionWhere = {
  OR: [
    { state: 'draft', ...mine },
    { state: 'published', ...mine },
    { state: 'archived', ...mine },
  ],
}

const approverReview = {
  createdAt: new Date('2026-10-02'),
  reviewer: { role: { level: 1 } },
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.articleFindMany.mockResolvedValue([])
  mocks.articleCount.mockResolvedValue(0)
})

describe('getTaxonomyArticleSummary', () => {
  test('counts and lists only the articles the viewer may see', async () => {
    await getTaxonomyArticleSummary(contributor, relationWhere)

    const scoped = { AND: [permissionWhere, relationWhere] }
    expect(mocks.articleFindMany.mock.lastCall?.[0]).toMatchObject({
      take: 5,
      where: scoped,
    })
    for (const [query] of mocks.articleCount.mock.calls) {
      expect(query.where.AND[0]).toEqual(scoped)
    }
  })

  test('counts every state once, in the detail order', async () => {
    mocks.articleCount.mockImplementation(({ where }) =>
      Promise.resolve(where.AND[1].state === 'published' ? 18 : 1),
    )

    const { stateCounts } = await getTaxonomyArticleSummary(
      contributor,
      relationWhere,
    )

    expect(stateCounts).toEqual([
      { count: 18, queue: 'published' },
      { count: 1, queue: 'draft' },
      { count: 1, queue: 'pending' },
      { count: 1, queue: 'approved' },
      { count: 1, queue: 'archived' },
    ])
  })

  test('a submitted draft carries the tag its list row shows', async () => {
    mocks.articleFindMany.mockResolvedValue([
      {
        id: 'waiting',
        reviews: [],
        state: 'draft',
        submittedAt: new Date('2026-10-01'),
        title: 'Čeká',
      },
      {
        id: 'approved',
        reviews: [approverReview],
        state: 'draft',
        submittedAt: new Date('2026-10-01'),
        title: 'Schválený',
      },
      {
        id: 'draft',
        reviews: [],
        state: 'draft',
        submittedAt: null,
        title: 'Koncept',
      },
      {
        id: 'archived',
        reviews: [],
        state: 'archived',
        submittedAt: null,
        title: 'Archiv',
      },
    ])

    const { recentArticles } = await getTaxonomyArticleSummary(
      contributor,
      relationWhere,
    )

    expect(recentArticles.map((article) => article.state)).toEqual([
      'pending',
      'approved',
      'draft',
      'archived',
    ])
  })
})
