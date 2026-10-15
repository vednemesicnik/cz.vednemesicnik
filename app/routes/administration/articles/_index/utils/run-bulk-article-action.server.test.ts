import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createEditHeldRefusal } from '~/utils/edit-hold/create-edit-held-refusal.server'

import { runBulkArticleAction } from './run-bulk-article-action.server'

// The database read, the permission context and the state transitions are
// mocked; eligibility (flags → row actions → bulk actions) runs for real.
const {
  archiveMock,
  deleteMock,
  findManyMock,
  getAuthorPermissionContextMock,
  publishMock,
} = vi.hoisted(() => ({
  archiveMock: vi.fn(),
  deleteMock: vi.fn(),
  findManyMock: vi.fn(),
  getAuthorPermissionContextMock: vi.fn(),
  publishMock: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { article: { findMany: findManyMock } },
}))

vi.mock(
  '~/utils/permissions/author/context/get-author-permission-context.server',
  () => ({ getAuthorPermissionContext: getAuthorPermissionContextMock }),
)

vi.mock('../../article/_index/utils/content-state-handlers.server', () => ({
  articleContentStateHandlers: {
    archive: archiveMock,
    delete: deleteMock,
    publish: publishMock,
  },
}))

const request = new Request('https://test.local/')

const CONTRIBUTOR = { id: 'contributor', role: { level: 3 } }

type ArticleRow = {
  id: string
  state: 'draft' | 'published' | 'archived'
  publishedAt?: Date | null
  submittedAt?: Date | null
  /** Someone else edits it (07g). */
  isHeld?: boolean
}

const article = ({
  id,
  state,
  publishedAt = null,
  submittedAt = null,
  isHeld = false,
}: ArticleRow) => ({
  authors: [CONTRIBUTOR],
  heldByAuthorId: isHeld ? 'contributor' : null,
  heldByTabId: isHeld ? 'tab-1' : null,
  heldSince: isHeld ? new Date(Date.now() - 60_000) : null,
  heldUntil: isHeld ? new Date(Date.now() + 60_000) : null,
  id,
  publishedAt,
  reviews: [],
  state,
  submittedAt,
})

beforeEach(() => {
  vi.clearAllMocks()
  // The Coordinator, allowed everything the permission table grants.
  getAuthorPermissionContextMock.mockResolvedValue({
    authorId: 'coordinator',
    can: () => ({ hasAny: true, hasOwn: false, hasPermission: true }),
    roleLevel: 1,
  })
  publishMock.mockResolvedValue({ missing: [] })
  archiveMock.mockResolvedValue(undefined)
  deleteMock.mockResolvedValue(undefined)
})

describe('runBulkArticleAction — publish', () => {
  test('gives the never-published articles their order, keeps a stored date', async () => {
    const storedDate = new Date('2026-09-19T08:00:00.000Z')
    findManyMock.mockResolvedValue([
      article({ id: 'first', state: 'draft' }),
      article({ id: 'returning', publishedAt: storedDate, state: 'draft' }),
      article({ id: 'second', state: 'draft' }),
    ])
    const publishBase = new Date('2026-10-13T10:00:00.000Z')

    const result = await runBulkArticleAction(request, {
      action: 'publish',
      ids: ['first', 'returning', 'second'],
      publishBase,
    })

    expect(
      publishMock.mock.calls.map(([, options]) => [
        options.id,
        options.publishedAt?.toISOString(),
      ]),
    ).toEqual([
      ['first', '2026-10-13T10:00:00.000Z'],
      ['returning', undefined],
      ['second', '2026-10-13T09:59:59.000Z'],
    ])
    expect(result).toEqual({
      onlyDrafts: true,
      processedCount: 3,
      skippedCount: 0,
    })
  })

  test('skips an incomplete article and counts it', async () => {
    findManyMock.mockResolvedValue([
      article({ id: 'complete', state: 'draft' }),
      article({ id: 'incomplete', state: 'draft' }),
    ])
    publishMock.mockImplementation((_request, options) =>
      Promise.resolve({
        missing: options.id === 'incomplete' ? ['Chybí perex.'] : [],
      }),
    )

    const result = await runBulkArticleAction(request, {
      action: 'publish',
      ids: ['complete', 'incomplete'],
      publishBase: new Date(),
    })

    expect(result.processedCount).toBe(1)
    expect(result.skippedCount).toBe(1)
  })

  test('skips an article that is gone or no longer eligible, without touching it', async () => {
    findManyMock.mockResolvedValue([
      article({ id: 'draft', state: 'draft' }),
      article({ id: 'published-meanwhile', state: 'published' }),
    ])

    const result = await runBulkArticleAction(request, {
      action: 'publish',
      ids: ['draft', 'published-meanwhile', 'deleted-meanwhile'],
      publishBase: new Date(),
    })

    expect(publishMock.mock.calls.map(([, options]) => options.id)).toEqual([
      'draft',
    ])
    expect(result).toEqual({
      onlyDrafts: false,
      processedCount: 1,
      skippedCount: 2,
    })
  })

  test('publishes nothing for an author who does not approve', async () => {
    getAuthorPermissionContextMock.mockResolvedValue({
      authorId: 'creator',
      can: () => ({ hasAny: true, hasOwn: false, hasPermission: true }),
      roleLevel: 2,
    })
    findManyMock.mockResolvedValue([article({ id: 'draft', state: 'draft' })])

    const result = await runBulkArticleAction(request, {
      action: 'publish',
      ids: ['draft'],
      publishBase: new Date(),
    })

    expect(publishMock).not.toHaveBeenCalled()
    expect(result.skippedCount).toBe(1)
  })
})

describe('runBulkArticleAction — archive and delete', () => {
  test('archives published articles', async () => {
    findManyMock.mockResolvedValue([
      article({ id: 'published', state: 'published' }),
    ])

    const result = await runBulkArticleAction(request, {
      action: 'archive',
      ids: ['published'],
    })

    expect(archiveMock).toHaveBeenCalledOnce()
    expect(result).toEqual({
      onlyDrafts: false,
      processedCount: 1,
      skippedCount: 0,
    })
  })

  test('deletes drafts but skips a submitted one', async () => {
    findManyMock.mockResolvedValue([
      article({ id: 'draft', state: 'draft' }),
      article({ id: 'submitted', state: 'draft', submittedAt: new Date() }),
    ])

    const result = await runBulkArticleAction(request, {
      action: 'delete',
      ids: ['draft', 'submitted'],
    })

    expect(deleteMock.mock.calls.map(([, options]) => options.id)).toEqual([
      'draft',
    ])
    expect(result).toEqual({
      onlyDrafts: true,
      processedCount: 1,
      skippedCount: 1,
    })
  })
})

describe('runBulkArticleAction — the edit hold (07g, 22f)', () => {
  test('skips an article someone else edits, without touching it', async () => {
    findManyMock.mockResolvedValue([
      article({ id: 'free', state: 'draft' }),
      article({ id: 'held', isHeld: true, state: 'draft' }),
    ])

    const result = await runBulkArticleAction(request, {
      action: 'delete',
      ids: ['free', 'held'],
    })

    expect(deleteMock.mock.calls.map(([, options]) => options.id)).toEqual([
      'free',
    ])
    expect(result).toMatchObject({ processedCount: 1, skippedCount: 1 })
  })

  test('counts a transition its own write refused as skipped', async () => {
    findManyMock.mockResolvedValue([
      article({ id: 'taken-meanwhile', state: 'draft' }),
    ])
    deleteMock.mockRejectedValue(createEditHeldRefusal('Jakub Novák'))

    const result = await runBulkArticleAction(request, {
      action: 'delete',
      ids: ['taken-meanwhile'],
    })

    expect(result).toMatchObject({ processedCount: 0, skippedCount: 1 })
  })
})
