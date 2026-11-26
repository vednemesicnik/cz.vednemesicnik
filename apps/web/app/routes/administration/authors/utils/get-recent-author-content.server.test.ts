import { beforeEach, describe, expect, test, vi } from 'vitest'

const { articleFindMany, episodeFindMany, issueFindMany } = vi.hoisted(() => ({
  articleFindMany: vi.fn(),
  episodeFindMany: vi.fn(),
  issueFindMany: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    article: { findMany: articleFindMany },
    issue: { findMany: issueFindMany },
    podcastEpisode: { findMany: episodeFindMany },
  },
}))

import { getRecentAuthorContent } from './get-recent-author-content.server'

const context = {
  authorId: 'viewer',
  can: () => ({ hasAny: true, hasOwn: true, hasPermission: true }),
}

const review = { reviews: [], submittedAt: null }

describe('getRecentAuthorContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('merges the types by last edit and keeps five', async () => {
    articleFindMany.mockResolvedValue([
      {
        ...review,
        id: 'article-new',
        state: 'published',
        title: 'Deset knih na podzim',
        updatedAt: new Date('2026-10-20T10:00:00Z'),
      },
      {
        ...review,
        id: 'article-old',
        state: 'archived',
        title: 'Starý text',
        updatedAt: new Date('2026-01-01T10:00:00Z'),
      },
    ])
    episodeFindMany.mockResolvedValue([
      {
        ...review,
        id: 'episode',
        number: 14,
        podcastId: 'podcast',
        state: 'draft',
        title: 'Školník, který ví všechno',
        updatedAt: new Date('2026-10-21T10:00:00Z'),
      },
    ])
    issueFindMany.mockResolvedValue([
      {
        ...review,
        id: 'issue',
        name: 'září',
        order: 3,
        state: 'published',
        supplement: null,
        updatedAt: new Date('2026-09-30T10:00:00Z'),
        year: 2026,
      },
      {
        ...review,
        id: 'issue-2',
        name: 'jaro',
        order: 1,
        state: 'published',
        supplement: null,
        updatedAt: new Date('2026-03-30T10:00:00Z'),
        year: 2026,
      },
      {
        ...review,
        id: 'issue-3',
        name: 'zima',
        order: 4,
        state: 'published',
        supplement: null,
        updatedAt: new Date('2025-12-30T10:00:00Z'),
        year: 2025,
      },
    ])

    const items = await getRecentAuthorContent(context, 'author')

    expect(items).toEqual([
      {
        href: '/administration/podcasts/podcast/episodes/episode',
        id: 'episode',
        state: 'draft',
        title: '#14 Školník, který ví všechno',
        type: 'episode',
      },
      {
        href: '/administration/articles/article-new',
        id: 'article-new',
        state: 'published',
        title: 'Deset knih na podzim',
        type: 'article',
      },
      {
        href: '/administration/archive/issue',
        id: 'issue',
        state: 'published',
        title: 'září 2026',
        type: 'issue',
      },
      {
        href: '/administration/archive/issue-2',
        id: 'issue-2',
        state: 'published',
        title: 'jaro 2026',
        type: 'issue',
      },
      {
        href: '/administration/articles/article-old',
        id: 'article-old',
        state: 'archived',
        title: 'Starý text',
        type: 'article',
      },
    ])
  })

  test("shows a submitted draft's review state", async () => {
    articleFindMany.mockResolvedValue([
      {
        id: 'article',
        reviews: [],
        state: 'draft',
        submittedAt: new Date('2026-10-20T10:00:00Z'),
        title: 'Odeslaný text',
        updatedAt: new Date('2026-10-20T10:00:00Z'),
      },
    ])
    episodeFindMany.mockResolvedValue([])
    issueFindMany.mockResolvedValue([])

    const [item] = await getRecentAuthorContent(context, 'author')

    expect(item?.state).toBe('pending')
  })

  test("reads only the author's content the viewer may see", async () => {
    articleFindMany.mockResolvedValue([])
    episodeFindMany.mockResolvedValue([])
    issueFindMany.mockResolvedValue([])

    await getRecentAuthorContent(context, 'author')

    expect(articleFindMany.mock.lastCall?.[0].where.AND).toContainEqual({
      authors: { some: { id: 'author' } },
    })
    expect(episodeFindMany.mock.lastCall?.[0].where.AND).toContainEqual({
      authorId: 'author',
    })
    expect(issueFindMany.mock.lastCall?.[0].where.AND).toContainEqual({
      authorId: 'author',
    })
  })
})
