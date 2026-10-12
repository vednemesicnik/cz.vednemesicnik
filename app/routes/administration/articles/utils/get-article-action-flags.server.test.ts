import { describe, expect, test } from 'vitest'

import { getArticleActionFlags } from './get-article-action-flags.server'

const COORDINATOR = { level: 1 }
const CREATOR = { level: 2 }
const CONTRIBUTOR = { level: 3 }

// The permission matrix itself is tested elsewhere; here every right is held
// on own content, and the Coordinator holds it on any content too.
const createContext = (authorId: string, roleLevel: number) => ({
  authorId,
  can: ({ targetAuthorIds = [authorId] }: { targetAuthorIds?: string[] }) => {
    const hasOwn = targetAuthorIds.includes(authorId)
    const hasAny = roleLevel === COORDINATOR.level

    return { hasAny, hasOwn, hasPermission: hasOwn || hasAny }
  },
  roleLevel,
})

const submittedAt = new Date('2026-09-25T10:00:00Z')
const approvedAt = new Date('2026-09-27T10:00:00Z')

const draftBy = (authorId: string, role: { level: number }) => ({
  authors: [{ id: authorId, role }],
  reviews: [],
  state: 'draft' as const,
  submittedAt: null,
})

describe('getArticleActionFlags', () => {
  test('the Coordinator approves, publishes and returns a waiting draft', () => {
    const flags = getArticleActionFlags(createContext('coordinator', 1), {
      ...draftBy('contributor', CONTRIBUTOR),
      submittedAt,
    })

    expect(flags).toMatchObject({
      canApprove: true,
      canDelete: false,
      canEdit: true,
      canPublish: true,
      canReturn: true,
      canWithdraw: false,
      isOwnContent: false,
      submission: { date: submittedAt, state: 'pending' },
    })
  })

  test('an approving review makes the draft approved, and approval is not offered again', () => {
    const flags = getArticleActionFlags(createContext('coordinator', 1), {
      ...draftBy('contributor', CONTRIBUTOR),
      reviews: [
        {
          createdAt: approvedAt,
          reviewer: { id: 'coordinator', role: COORDINATOR },
        },
      ],
      submittedAt,
    })

    expect(flags.canApprove).toBe(false)
    expect(flags.submission).toEqual({ date: approvedAt, state: 'approved' })
  })

  test('its author only takes a waiting draft back', () => {
    const flags = getArticleActionFlags(createContext('contributor', 3), {
      ...draftBy('contributor', CONTRIBUTOR),
      submittedAt,
    })

    expect(flags).toMatchObject({
      canApprove: false,
      canDelete: false,
      canEdit: false,
      canPublish: false,
      canReturn: false,
      canSubmit: false,
      canWithdraw: true,
      isOwnContent: true,
    })
  })

  test('the Creator submits an own draft instead of publishing it', () => {
    const flags = getArticleActionFlags(
      createContext('creator', 2),
      draftBy('creator', CREATOR),
    )

    expect(flags).toMatchObject({
      canDelete: true,
      canEdit: true,
      canPublish: false,
      canSubmit: true,
      isSubmittable: true,
      submission: null,
    })
  })

  test('a draft with a Coordinator among its authors is not submitted', () => {
    const flags = getArticleActionFlags(
      createContext('coordinator', 1),
      draftBy('coordinator', COORDINATOR),
    )

    expect(flags).toMatchObject({
      canPublish: true,
      canSubmit: false,
      isSubmittable: false,
    })
  })

  test('only the Coordinator changes the publish date', () => {
    const published = {
      ...draftBy('creator', CREATOR),
      state: 'published' as const,
    }

    expect(
      getArticleActionFlags(createContext('creator', 2), published)
        .canChangePublishedAt,
    ).toBe(false)
    expect(
      getArticleActionFlags(createContext('coordinator', 1), published)
        .canChangePublishedAt,
    ).toBe(true)
  })
})
