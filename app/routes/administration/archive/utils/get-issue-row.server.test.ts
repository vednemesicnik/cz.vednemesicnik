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
})
