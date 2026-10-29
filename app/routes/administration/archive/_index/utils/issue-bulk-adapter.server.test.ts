import { beforeEach, describe, expect, test, vi } from 'vitest'

import { runBulkContentAction } from '~/utils/bulk-action/run-bulk-content-action.server'

import { issueBulkAdapter } from './issue-bulk-adapter.server'

// The database read, the permission context and the state transitions are
// mocked; eligibility (flags → issue row actions → bulk actions) runs for real.
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
  prisma: { issue: { findMany: findManyMock } },
}))

vi.mock(
  '~/utils/permissions/author/context/get-author-permission-context.server',
  () => ({ getAuthorPermissionContext: getAuthorPermissionContextMock }),
)

vi.mock('../../issue/_index/utils/content-state-handlers.server', () => ({
  issueContentStateHandlers: handlerMocks,
}))

const request = new Request('https://test.local/')

const issue = (
  id: string,
  state: 'draft' | 'published' | 'archived',
  { isHeld = false } = {},
) => ({
  author: { id: 'creator', role: { level: 2 } },
  heldByAuthorId: isHeld ? 'creator' : null,
  heldByTabId: isHeld ? 'tab-1' : null,
  heldSince: isHeld ? new Date(Date.now() - 60_000) : null,
  heldUntil: isHeld ? new Date(Date.now() + 60_000) : null,
  id,
  publishedAt: null,
  reviews: [],
  state,
  submittedAt: null,
})

const runForIssues = (
  options: Omit<Parameters<typeof runBulkContentAction>[1], 'adapter'>,
) => runBulkContentAction(request, { ...options, adapter: issueBulkAdapter })

beforeEach(() => {
  vi.clearAllMocks()
  getAuthorPermissionContextMock.mockResolvedValue({
    authorId: 'coordinator',
    can: () => ({ hasAny: true, hasOwn: false, hasPermission: true }),
    roleLevel: 1,
  })
  handlerMocks.publish.mockResolvedValue({ missing: [] })
})

describe('issueBulkAdapter (26f)', () => {
  test('publishes without a date or an order (log 0031)', async () => {
    findManyMock.mockResolvedValue([issue('a', 'draft'), issue('b', 'draft')])

    const result = await runForIssues({ action: 'publish', ids: ['a', 'b'] })

    expect(
      handlerMocks.publish.mock.calls.map(([, options]) => [
        options.id,
        options.publishedAt,
        options.orderedAt,
      ]),
    ).toEqual([
      ['a', undefined, undefined],
      ['b', undefined, undefined],
    ])
    expect(result).toMatchObject({ action: 'publish', processedCount: 2 })
  })

  test('skips an incomplete issue (26e)', async () => {
    findManyMock.mockResolvedValue([issue('a', 'draft')])
    handlerMocks.publish.mockResolvedValue({ missing: ['Chybí PDF.'] })

    const result = await runForIssues({ action: 'publish', ids: ['a'] })

    expect(result).toMatchObject({ processedCount: 0, skippedCount: 1 })
  })

  test('retracts and archives published issues, its one author as the target', async () => {
    findManyMock.mockResolvedValue([issue('a', 'published')])

    await runForIssues({ action: 'retract', ids: ['a'] })
    await runForIssues({ action: 'archive', ids: ['a'] })

    expect(handlerMocks.retract.mock.calls[0][1]).toEqual({
      id: 'a',
      target: { authorIds: ['creator'], state: 'published' },
    })
    expect(handlerMocks.archive).toHaveBeenCalledOnce()
  })

  test('never deletes a published issue (07b)', async () => {
    findManyMock.mockResolvedValue([issue('a', 'published')])

    const result = await runForIssues({ action: 'delete', ids: ['a'] })

    expect(handlerMocks.delete).not.toHaveBeenCalled()
    expect(result).toMatchObject({ processedCount: 0, skippedCount: 1 })
  })

  test('skips an issue someone else edits (26i)', async () => {
    findManyMock.mockResolvedValue([issue('a', 'archived', { isHeld: true })])

    const result = await runForIssues({ action: 'restore', ids: ['a'] })

    expect(handlerMocks.restore).not.toHaveBeenCalled()
    expect(result).toMatchObject({ processedCount: 0, skippedCount: 1 })
  })
})
