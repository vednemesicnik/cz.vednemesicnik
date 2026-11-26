import { describe, expect, test } from 'vitest'

import { getIssueRow } from './get-issue-row.server'
import type { IssueRowRecord } from './issue-row-select'

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

const now = new Date('2026-10-29T12:00:00Z')

const issue = (
  overrides: Partial<IssueRowRecord>,
): IssueRowRecord & { title: string } => ({
  author: { id: 'contributor', name: 'Jakub', role: { level: 3 } },
  cover: null,
  heldByAuthor: null,
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
  id: 'issue',
  name: 'září',
  order: 3,
  pdf: null,
  reviews: [],
  state: 'draft',
  submittedAt: null,
  submittedBy: null,
  supplement: '',
  supplementSlug: '',
  title: 'září 2026',
  updatedAt: new Date('2026-09-26T10:00:00Z'),
  year: 2026,
  ...overrides,
})

describe('getIssueRow', () => {
  test('the Coordinator approves a waiting issue and learns what publishing it lacks', () => {
    const row = getIssueRow(
      issue({ submittedAt: new Date('2026-09-26T10:00:00Z') }),
      { context: createContext('coordinator', 1), isNumberTaken: false, now },
    )

    expect(row).toMatchObject({
      isIncomplete: true,
      row: 'approve',
      submission: 'pending',
      supplement: null,
      title: 'září 2026',
    })
    expect(row.missingBeforePublish.length).toBeGreaterThan(0)
  })

  test('an author never gets the list of what publishing lacks', () => {
    const row = getIssueRow(issue({}), {
      context: createContext('contributor', 3),
      isNumberTaken: false,
      now,
    })

    expect(row.missingBeforePublish).toEqual([])
    expect(row.row).toBe('edit')
  })

  test('a complete issue whose number another holds is incomplete and says so', () => {
    const row = getIssueRow(
      issue({
        cover: {
          altText: '',
          id: 'cover',
          intrinsicHeight: 400,
          intrinsicWidth: 300,
          placeholderDataUrl: '',
          version: 'v1',
        },
        pdf: { fileName: null, originalFileName: 'zari.pdf' },
        submittedAt: new Date('2026-09-26T10:00:00Z'),
      }),
      { context: createContext('coordinator', 1), isNumberTaken: true, now },
    )

    expect(row.isIncomplete).toBe(true)
    expect(row.missingBeforePublish).toHaveLength(1)
    expect(row.missingBeforePublish[0]).toContain('3/2026')
  })

  test('while someone else edits it, the Coordinator takes it over instead of approving', () => {
    const row = getIssueRow(
      issue({
        heldByAuthor: { name: 'Jakub' },
        heldByAuthorId: 'contributor',
        heldByTabId: 'tab',
        heldSince: new Date('2026-10-29T11:55:00Z'),
        heldUntil: new Date('2026-10-29T12:05:00Z'),
        submittedAt: new Date('2026-09-26T10:00:00Z'),
      }),
      { context: createContext('coordinator', 1), isNumberTaken: false, now },
    )

    expect(row.isHeldByOther).toBe(true)
    expect(row.row).not.toBe('approve')
    expect(row.holdLine).not.toBeNull()
  })
})
