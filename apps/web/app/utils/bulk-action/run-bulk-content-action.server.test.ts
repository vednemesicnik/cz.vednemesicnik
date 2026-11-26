import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { ContentStateHandlers } from '~/utils/content-state/create-content-state-handlers.server'

import type {
  BulkContentAdapter,
  BulkContentRow,
} from './run-bulk-content-action.server'
import { runBulkContentAction } from './run-bulk-content-action.server'

// The permission context is mocked; flags → row actions → bulk actions run
// for real through the stub adapter.
const { getAuthorPermissionContextMock } = vi.hoisted(() => ({
  getAuthorPermissionContextMock: vi.fn(),
}))

vi.mock(
  '~/utils/permissions/author/context/get-author-permission-context.server',
  () => ({ getAuthorPermissionContext: getAuthorPermissionContextMock }),
)

const request = new Request('https://test.local/')

const handlers = {
  archive: vi.fn().mockResolvedValue(undefined),
  changePublishedAt: vi.fn(),
  delete: vi.fn().mockResolvedValue(undefined),
  publish: vi.fn().mockResolvedValue({ missing: [] }),
  restore: vi.fn().mockResolvedValue(undefined),
  retract: vi.fn().mockResolvedValue(undefined),
  review: vi.fn(),
} satisfies ContentStateHandlers

const row = (
  id: string,
  overrides: Partial<BulkContentRow> = {},
): BulkContentRow => ({
  authors: [{ id: 'author', role: { level: 3 } }],
  hold: null,
  id,
  publishedAt: null,
  reviews: [],
  state: 'draft',
  submittedAt: null,
  ...overrides,
})

const adapter = (
  rows: BulkContentRow[],
  publishDate: BulkContentAdapter<BulkContentRow>['publishDate'],
): BulkContentAdapter<BulkContentRow> => ({
  entity: 'podcast',
  getRowActions: (record) =>
    record.state === 'draft'
      ? { menu: ['publish', 'delete'], row: 'edit' }
      : { menu: ['retract', 'archive'], row: null },
  handlers,
  loadRows: () => Promise.resolve(rows),
  publishDate,
})

beforeEach(() => {
  vi.clearAllMocks()
  getAuthorPermissionContextMock.mockResolvedValue({
    authorId: 'coordinator',
    can: () => ({ hasAny: true, hasOwn: false, hasPermission: true }),
    roleLevel: 1,
  })
})

describe('runBulkContentAction — the publish moment', () => {
  test('`ordered` spaces never-published records a second apart as orderedAt (27a)', async () => {
    const stored = new Date('2025-01-01T00:00:00.000Z')

    await runBulkContentAction(request, {
      action: 'publish',
      adapter: adapter(
        [row('top'), row('kept', { publishedAt: stored }), row('next')],
        'ordered',
      ),
      ids: ['top', 'kept', 'next'],
    })

    const calls = handlers.publish.mock.calls.map(([, options]) => options)
    expect(calls.map((options) => options.publishedAt)).toEqual([
      undefined,
      undefined,
      undefined,
    ])
    const [top, kept, next] = calls.map((options) => options.orderedAt)
    expect(kept).toBeUndefined()
    expect(top?.getTime()).toBe((next?.getTime() ?? 0) + 1000)
  })

  test('`none` passes no moment at all', async () => {
    await runBulkContentAction(request, {
      action: 'publish',
      adapter: adapter([row('only')], 'none'),
      ids: ['only'],
    })

    const [[, options]] = handlers.publish.mock.calls
    expect(options.publishedAt).toBeUndefined()
    expect(options.orderedAt).toBeUndefined()
  })
})

describe('runBulkContentAction — content without an edit hold', () => {
  test('a record without a hold is free, deleting included', async () => {
    const result = await runBulkContentAction(request, {
      action: 'delete',
      adapter: adapter([row('free')], 'none'),
      ids: ['free'],
    })

    expect(handlers.delete).toHaveBeenCalledOnce()
    expect(result).toEqual({
      action: 'delete',
      hasRelated: false,
      onlyDrafts: true,
      processedCount: 1,
      skippedCount: 0,
    })
  })

  test('retracts through the adapter’s handlers', async () => {
    const result = await runBulkContentAction(request, {
      action: 'retract',
      adapter: adapter(
        [row('published', { state: 'published' }), row('draft')],
        'none',
      ),
      ids: ['published', 'draft'],
    })

    expect(
      handlers.retract.mock.calls.map(([, options]) => options.id),
    ).toEqual(['published'])
    expect(result).toMatchObject({ processedCount: 1, skippedCount: 1 })
  })
})
