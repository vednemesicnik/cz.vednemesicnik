import { describe, expect, test } from 'vitest'

import type { ArticleRowRecord } from './article-row-select'
import { getArticleRow } from './get-article-row.server'

// The permission matrix itself is tested elsewhere; here every right is held
// on own content, and the Coordinator holds it on any content too.
const createContext = (authorId: string, roleLevel: number) => ({
  authorId,
  can: ({ targetAuthorIds = [authorId] }: { targetAuthorIds?: string[] }) => {
    const hasOwn = targetAuthorIds.includes(authorId)
    const hasAny = roleLevel === 1

    return { hasAny, hasOwn, hasPermission: hasOwn || hasAny }
  },
  roleLevel,
})

const now = new Date('2026-10-29T12:00:00Z')

const article = (overrides: Partial<ArticleRowRecord>): ArticleRowRecord => ({
  authors: [{ id: 'contributor', name: 'Anna', role: { level: 3 } }],
  heldByAuthor: null,
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
  id: 'article',
  publishedAt: null,
  reviews: [],
  slug: 'rozhovor',
  state: 'draft',
  submittedAt: null,
  title: 'Rozhovor',
  updatedAt: new Date('2026-09-22T10:00:00Z'),
  ...overrides,
})

describe('getArticleRow', () => {
  test('the Coordinator approves a waiting article from its row', () => {
    const row = getArticleRow(
      article({ submittedAt: new Date('2026-09-25T10:00:00Z') }),
      { context: createContext('coordinator', 1), now },
    )

    expect(row).toMatchObject({
      authorNames: ['Anna'],
      holdLine: null,
      isHeldByOther: false,
      row: 'approve',
      state: 'pending',
    })
    expect(row.bulkActions).toContain('publish')
  })

  test('while someone else edits it, the row waits and says who, but bulk still offers it', () => {
    const row = getArticleRow(
      article({
        heldByAuthor: { name: 'Jakub' },
        heldByAuthorId: 'creator',
        heldByTabId: 'tab',
        heldSince: new Date('2026-10-29T11:55:00Z'),
        heldUntil: new Date('2026-10-29T12:05:00Z'),
        submittedAt: new Date('2026-09-25T10:00:00Z'),
      }),
      { context: createContext('coordinator', 1), now },
    )

    expect(row.isHeldByOther).toBe(true)
    expect(row.row).not.toBe('approve')
    expect(row.holdLine).not.toBeNull()
    expect(row.heldUntil).toBe('2026-10-29T12:05:00.000Z')
    expect(row.bulkActions).toContain('publish')
  })

  test('an own draft without a title opens for editing and is marked untitled', () => {
    const row = getArticleRow(article({ title: ' ' }), {
      context: createContext('contributor', 3),
      now,
    })

    expect(row).toMatchObject({
      isNotSubmitted: false,
      isUntitled: true,
      row: 'edit',
      state: 'draft',
    })
  })
})
