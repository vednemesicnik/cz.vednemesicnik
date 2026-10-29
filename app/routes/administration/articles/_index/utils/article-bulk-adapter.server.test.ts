import { beforeEach, describe, expect, test, vi } from 'vitest'

import { runBulkContentAction } from '~/utils/bulk-action/run-bulk-content-action.server'
import { createEditHeldRefusal } from '~/utils/edit-hold/create-edit-held-refusal.server'

import { articleBulkAdapter } from './article-bulk-adapter.server'

// The database read, the permission context and the state transitions are
// mocked; eligibility (flags → row actions → bulk actions) runs for real.
const {
  archiveMock,
  deleteMock,
  findManyMock,
  getAuthorPermissionContextMock,
  publishMock,
  restoreMock,
  retractMock,
} = vi.hoisted(() => ({
  archiveMock: vi.fn(),
  deleteMock: vi.fn(),
  findManyMock: vi.fn(),
  getAuthorPermissionContextMock: vi.fn(),
  publishMock: vi.fn(),
  restoreMock: vi.fn(),
  retractMock: vi.fn(),
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
    restore: restoreMock,
    retract: retractMock,
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
  restoreMock.mockResolvedValue(undefined)
  retractMock.mockResolvedValue(undefined)
})

const runForArticles = (
  options: Omit<Parameters<typeof runBulkContentAction>[1], 'adapter'>,
) => runBulkContentAction(request, { ...options, adapter: articleBulkAdapter })

describe('articleBulkAdapter — publish', () => {
  test('gives the never-published articles their order, keeps a stored date', async () => {
    const storedDate = new Date('2026-09-19T08:00:00.000Z')
    findManyMock.mockResolvedValue([
      article({ id: 'first', state: 'draft' }),
      article({ id: 'returning', publishedAt: storedDate, state: 'draft' }),
      article({ id: 'second', state: 'draft' }),
    ])
    const publishBase = new Date('2026-10-13T10:00:00.000Z')

    const result = await runForArticles({
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
      action: 'publish',
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

    const result = await runForArticles({
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

    const result = await runForArticles({
      action: 'publish',
      ids: ['draft', 'published-meanwhile', 'deleted-meanwhile'],
      publishBase: new Date(),
    })

    expect(publishMock.mock.calls.map(([, options]) => options.id)).toEqual([
      'draft',
    ])
    expect(result).toEqual({
      action: 'publish',
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

    const result = await runForArticles({
      action: 'publish',
      ids: ['draft'],
      publishBase: new Date(),
    })

    expect(publishMock).not.toHaveBeenCalled()
    expect(result.skippedCount).toBe(1)
  })
})

describe('articleBulkAdapter — retract, archive, restore and delete', () => {
  test('archives published articles', async () => {
    findManyMock.mockResolvedValue([
      article({ id: 'published', state: 'published' }),
    ])

    const result = await runForArticles({
      action: 'archive',
      ids: ['published'],
    })

    expect(archiveMock).toHaveBeenCalledOnce()
    expect(result).toEqual({
      action: 'archive',
      onlyDrafts: false,
      processedCount: 1,
      skippedCount: 0,
    })
  })

  test('retracts published articles, a Creator’s own too (ji6n8th3)', async () => {
    getAuthorPermissionContextMock.mockResolvedValue({
      authorId: 'contributor',
      can: () => ({ hasAny: false, hasOwn: true, hasPermission: true }),
      roleLevel: 2,
    })
    findManyMock.mockResolvedValue([
      article({ id: 'published', state: 'published' }),
      article({ id: 'draft', state: 'draft' }),
    ])

    const result = await runForArticles({
      action: 'retract',
      ids: ['published', 'draft'],
    })

    expect(retractMock.mock.calls.map(([, options]) => options.id)).toEqual([
      'published',
    ])
    expect(result).toMatchObject({ processedCount: 1, skippedCount: 1 })
  })

  test('restores archived articles as drafts, the Coordinator’s only', async () => {
    findManyMock.mockResolvedValue([
      article({ id: 'archived', state: 'archived' }),
    ])

    const restored = await runForArticles({
      action: 'restore',
      ids: ['archived'],
    })

    expect(restoreMock).toHaveBeenCalledOnce()
    expect(restored).toMatchObject({ action: 'restore', processedCount: 1 })

    getAuthorPermissionContextMock.mockResolvedValue({
      authorId: 'contributor',
      can: ({ action }: { action: string }) => ({
        hasAny: false,
        hasOwn: action !== 'restore',
        hasPermission: action !== 'restore',
      }),
      roleLevel: 2,
    })

    const refused = await runForArticles({
      action: 'restore',
      ids: ['archived'],
    })

    expect(restoreMock).toHaveBeenCalledOnce()
    expect(refused).toMatchObject({ processedCount: 0, skippedCount: 1 })
  })

  test('retracting a held article skips it (22f)', async () => {
    findManyMock.mockResolvedValue([
      article({ id: 'held', isHeld: true, state: 'published' }),
    ])

    const result = await runForArticles({
      action: 'retract',
      ids: ['held'],
    })

    expect(retractMock).not.toHaveBeenCalled()
    expect(result).toMatchObject({ processedCount: 0, skippedCount: 1 })
  })

  test('deletes drafts but skips a submitted one', async () => {
    findManyMock.mockResolvedValue([
      article({ id: 'draft', state: 'draft' }),
      article({ id: 'submitted', state: 'draft', submittedAt: new Date() }),
    ])

    const result = await runForArticles({
      action: 'delete',
      ids: ['draft', 'submitted'],
    })

    expect(deleteMock.mock.calls.map(([, options]) => options.id)).toEqual([
      'draft',
    ])
    expect(result).toEqual({
      action: 'delete',
      onlyDrafts: true,
      processedCount: 1,
      skippedCount: 1,
    })
  })
})

describe('articleBulkAdapter — the edit hold (07g, 22f)', () => {
  test('skips an article someone else edits, without touching it', async () => {
    findManyMock.mockResolvedValue([
      article({ id: 'free', state: 'draft' }),
      article({ id: 'held', isHeld: true, state: 'draft' }),
    ])

    const result = await runForArticles({
      action: 'delete',
      ids: ['free', 'held'],
    })

    expect(deleteMock.mock.calls.map(([, options]) => options.id)).toEqual([
      'free',
    ])
    expect(result).toMatchObject({ processedCount: 1, skippedCount: 1 })
  })

  test('skips a delete one’s own other tab holds, archiving it still goes (0036)', async () => {
    getAuthorPermissionContextMock.mockResolvedValue({
      authorId: 'contributor',
      can: () => ({ hasAny: true, hasOwn: true, hasPermission: true }),
      roleLevel: 1,
    })
    findManyMock.mockResolvedValue([
      article({ id: 'own-held', isHeld: true, state: 'draft' }),
    ])

    const deleted = await runForArticles({
      action: 'delete',
      ids: ['own-held'],
    })

    expect(deleteMock).not.toHaveBeenCalled()
    expect(deleted).toMatchObject({ processedCount: 0, skippedCount: 1 })

    findManyMock.mockResolvedValue([
      article({ id: 'own-held', isHeld: true, state: 'published' }),
    ])

    const archived = await runForArticles({
      action: 'archive',
      ids: ['own-held'],
    })

    expect(archiveMock).toHaveBeenCalledOnce()
    expect(archived).toMatchObject({ processedCount: 1, skippedCount: 0 })
  })

  test('counts a transition its own write refused as skipped', async () => {
    findManyMock.mockResolvedValue([
      article({ id: 'taken-meanwhile', state: 'draft' }),
    ])
    deleteMock.mockRejectedValue(
      createEditHeldRefusal({
        heldByName: 'Jakub Novák',
        isOwnOtherTab: false,
      }),
    )

    const result = await runForArticles({
      action: 'delete',
      ids: ['taken-meanwhile'],
    })

    expect(result).toMatchObject({ processedCount: 0, skippedCount: 1 })
  })
})
