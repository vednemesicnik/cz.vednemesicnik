import { describe, expect, test } from 'vitest'

import { getTaxonomyRow } from './get-taxonomy-row.server'
import type { TaxonomyRowRecord } from './taxonomy-row-select'

// Every right is held on own content, and the Coordinator holds it on any.
const createContext = (authorId: string, roleLevel: number) => ({
  authorId,
  can: ({ targetAuthorIds = [authorId] }: { targetAuthorIds?: string[] }) => {
    const hasOwn = targetAuthorIds.includes(authorId)
    const hasAny = roleLevel === 1

    return { hasAny, hasOwn, hasPermission: hasOwn || hasAny }
  },
  roleLevel,
})

const category = (
  overrides: Partial<TaxonomyRowRecord>,
): TaxonomyRowRecord => ({
  _count: { articles: 0 },
  author: { id: 'contributor', name: 'Jakub', role: { level: 3 } },
  id: 'category',
  name: 'Knihovna',
  reviews: [],
  slug: 'knihovna',
  state: 'draft',
  submittedAt: null,
  submittedBy: null,
  updatedAt: new Date('2026-09-26T10:00:00Z'),
  ...overrides,
})

describe('getTaxonomyRow', () => {
  test('the Coordinator approves a waiting category from its row', () => {
    const row = getTaxonomyRow(
      category({ submittedAt: new Date('2026-09-26T10:00:00Z') }),
      {
        articleCount: 4,
        context: createContext('coordinator', 1),
        entity: 'article_category',
      },
    )

    expect(row).toMatchObject({
      articleCount: 4,
      name: 'Knihovna',
      publishedArticleCount: 0,
      row: 'approve',
      state: 'pending',
    })
  })

  test('a published tag counts the articles a reader sees on its page', () => {
    const row = getTaxonomyRow(
      category({ _count: { articles: 18 }, state: 'published' }),
      {
        articleCount: 20,
        context: createContext('coordinator', 1),
        entity: 'article_tag',
      },
    )

    expect(row).toMatchObject({
      articleCount: 20,
      publishedArticleCount: 18,
      row: null,
      state: 'published',
    })
  })
})
