import { beforeEach, describe, expect, test, vi } from 'vitest'

import { runBulkContentAction } from '~/utils/bulk-action/run-bulk-content-action.server'

import { categoryBulkAdapter } from './category-bulk-adapter.server'

// The database read, the permission context and the state transitions are
// mocked; eligibility (flags → taxonomy row actions → bulk actions) runs for real.
const { findManyMock, getAuthorPermissionContextMock, handlerMocks } =
  vi.hoisted(() => ({
    findManyMock: vi.fn(),
    getAuthorPermissionContextMock: vi.fn(),
    handlerMocks: {
      archive: vi.fn(),
      delete: vi.fn(),
      publish: vi.fn(),
      restore: vi.fn(),
      retract: vi.fn(),
    },
  }))

vi.mock('~/utils/db.server', () => ({
  prisma: { articleCategory: { findMany: findManyMock } },
}))

vi.mock(
  '~/utils/permissions/author/context/get-author-permission-context.server',
  () => ({ getAuthorPermissionContext: getAuthorPermissionContextMock }),
)

vi.mock('../../category/_index/utils/content-state-handlers.server', () => ({
  categoryContentStateHandlers: handlerMocks,
}))

const request = new Request('https://test.local/')

const category = (id: string, state: 'draft' | 'published' | 'archived') => ({
  author: { id: 'creator', role: { level: 2 } },
  id,
  publishedAt: null,
  reviews: [],
  state,
  submittedAt: null,
})

const runForCategories = (
  options: Omit<Parameters<typeof runBulkContentAction>[1], 'adapter'>,
) => runBulkContentAction(request, { ...options, adapter: categoryBulkAdapter })

beforeEach(() => {
  vi.clearAllMocks()
  getAuthorPermissionContextMock.mockResolvedValue({
    authorId: 'coordinator',
    can: () => ({ hasAny: true, hasOwn: false, hasPermission: true }),
    roleLevel: 1,
  })
  handlerMocks.publish.mockResolvedValue({ missing: [] })
})

describe('categoryBulkAdapter (25g)', () => {
  test('publishes without a date or an order', async () => {
    findManyMock.mockResolvedValue([category('a', 'draft')])

    await runForCategories({ action: 'publish', ids: ['a'] })

    const [[, options]] = handlerMocks.publish.mock.calls
    expect(options.publishedAt).toBeUndefined()
    expect(options.orderedAt).toBeUndefined()
  })

  test('deletes an archived category: no edit hold to wait for', async () => {
    findManyMock.mockResolvedValue([category('a', 'archived')])

    const result = await runForCategories({ action: 'delete', ids: ['a'] })

    expect(handlerMocks.delete.mock.calls[0][1]).toEqual({
      id: 'a',
      target: { authorIds: ['creator'], state: 'archived' },
    })
    expect(result).toMatchObject({ processedCount: 1, skippedCount: 0 })
  })

  test('retracts a published category, never deletes it', async () => {
    findManyMock.mockResolvedValue([category('a', 'published')])

    await runForCategories({ action: 'retract', ids: ['a'] })
    const deleted = await runForCategories({ action: 'delete', ids: ['a'] })

    expect(handlerMocks.retract).toHaveBeenCalledOnce()
    expect(handlerMocks.delete).not.toHaveBeenCalled()
    expect(deleted).toMatchObject({ processedCount: 0, skippedCount: 1 })
  })

  test('a Creator retracts their own, never publishes (07c)', async () => {
    getAuthorPermissionContextMock.mockResolvedValue({
      authorId: 'creator',
      can: ({ action }: { action: string }) => ({
        hasAny: false,
        hasOwn: action !== 'publish',
        hasPermission: action !== 'publish',
      }),
      roleLevel: 2,
    })
    findManyMock.mockResolvedValue([category('own', 'published')])

    const retracted = await runForCategories({
      action: 'retract',
      ids: ['own'],
    })

    expect(retracted).toMatchObject({ processedCount: 1, skippedCount: 0 })

    findManyMock.mockResolvedValue([category('draft', 'draft')])

    const published = await runForCategories({
      action: 'publish',
      ids: ['draft'],
    })

    expect(handlerMocks.publish).not.toHaveBeenCalled()
    expect(published).toMatchObject({ processedCount: 0, skippedCount: 1 })
  })
})
