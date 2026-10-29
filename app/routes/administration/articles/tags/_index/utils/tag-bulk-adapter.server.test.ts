import { beforeEach, describe, expect, test, vi } from 'vitest'

import { runBulkContentAction } from '~/utils/bulk-action/run-bulk-content-action.server'

import { tagBulkAdapter } from './tag-bulk-adapter.server'

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
  prisma: { articleTag: { findMany: findManyMock } },
}))

vi.mock(
  '~/utils/permissions/author/context/get-author-permission-context.server',
  () => ({ getAuthorPermissionContext: getAuthorPermissionContextMock }),
)

vi.mock('../../tag/_index/utils/content-state-handlers.server', () => ({
  tagContentStateHandlers: handlerMocks,
}))

const request = new Request('https://test.local/')

const tag = (id: string, state: 'draft' | 'published' | 'archived') => ({
  author: { id: 'creator', role: { level: 2 } },
  id,
  publishedAt: null,
  reviews: [],
  state,
  submittedAt: null,
})

const runForTags = (
  options: Omit<Parameters<typeof runBulkContentAction>[1], 'adapter'>,
) => runBulkContentAction(request, { ...options, adapter: tagBulkAdapter })

beforeEach(() => {
  vi.clearAllMocks()
  getAuthorPermissionContextMock.mockResolvedValue({
    authorId: 'coordinator',
    can: () => ({ hasAny: true, hasOwn: false, hasPermission: true }),
    roleLevel: 1,
  })
  handlerMocks.publish.mockResolvedValue({ missing: [] })
})

describe('tagBulkAdapter (25g, as for categories)', () => {
  test('publishes without a date or an order', async () => {
    findManyMock.mockResolvedValue([tag('a', 'draft')])

    await runForTags({ action: 'publish', ids: ['a'] })

    const [[, options]] = handlerMocks.publish.mock.calls
    expect(options.publishedAt).toBeUndefined()
    expect(options.orderedAt).toBeUndefined()
  })

  test('deletes an archived tag: no edit hold to wait for', async () => {
    findManyMock.mockResolvedValue([tag('a', 'archived')])

    const result = await runForTags({ action: 'delete', ids: ['a'] })

    expect(handlerMocks.delete.mock.calls[0][1]).toEqual({
      id: 'a',
      target: { authorIds: ['creator'], state: 'archived' },
    })
    expect(result).toMatchObject({ processedCount: 1, skippedCount: 0 })
  })

  test('retracts a published tag, never deletes it', async () => {
    findManyMock.mockResolvedValue([tag('a', 'published')])

    await runForTags({ action: 'retract', ids: ['a'] })
    const deleted = await runForTags({ action: 'delete', ids: ['a'] })

    expect(handlerMocks.retract).toHaveBeenCalledOnce()
    expect(handlerMocks.delete).not.toHaveBeenCalled()
    expect(deleted).toMatchObject({ processedCount: 0, skippedCount: 1 })
  })
})
