import { beforeEach, describe, expect, test, vi } from 'vitest'

import { runBulkContentAction } from '~/utils/bulk-action/run-bulk-content-action.server'

import { createEpisodeBulkAdapter } from './create-episode-bulk-adapter.server'

// The database read, the permission context and the state transitions are
// mocked; eligibility (flags → episode row actions → bulk actions) runs for real.
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
  prisma: { podcastEpisode: { findMany: findManyMock } },
}))

vi.mock(
  '~/utils/permissions/author/context/get-author-permission-context.server',
  () => ({ getAuthorPermissionContext: getAuthorPermissionContextMock }),
)

vi.mock('../../episode/_index/utils/content-state-handlers.server', () => ({
  episodeContentStateHandlers: handlerMocks,
}))

const request = new Request('https://test.local/')

const episode = (
  id: string,
  number: number | null,
  {
    state = 'draft' as 'draft' | 'published' | 'archived',
    publishedAt = null as Date | null,
    podcastState = 'published' as 'draft' | 'published' | 'archived',
    createdAt = new Date('2026-10-01T00:00:00.000Z'),
  } = {},
) => ({
  author: { id: 'creator', role: { level: 2 } },
  createdAt,
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
  id,
  number,
  podcast: { state: podcastState },
  publishedAt,
  reviews: [],
  state,
  submittedAt: null,
})

const runForEpisodes = (
  options: Omit<Parameters<typeof runBulkContentAction>[1], 'adapter'>,
) =>
  runBulkContentAction(request, {
    ...options,
    adapter: createEpisodeBulkAdapter('podcast-1'),
  })

beforeEach(() => {
  vi.clearAllMocks()
  getAuthorPermissionContextMock.mockResolvedValue({
    authorId: 'coordinator',
    can: () => ({ hasAny: true, hasOwn: false, hasPermission: true }),
    roleLevel: 1,
  })
  handlerMocks.publish.mockResolvedValue({ missing: [] })
})

describe('createEpisodeBulkAdapter (27b)', () => {
  test('reads only the podcast’s own episodes', async () => {
    findManyMock.mockResolvedValue([])

    await runForEpisodes({ action: 'delete', ids: ['a'] })

    expect(findManyMock.mock.calls[0][0].where).toEqual({
      id: { in: ['a'] },
      podcastId: 'podcast-1',
    })
  })

  test('publishes by number, highest first a second apart from the chosen day, keeps a stored date', async () => {
    const stored = new Date('2026-05-14T08:00:00.000Z')
    findManyMock.mockResolvedValue([
      episode('twelve', 12),
      episode('fifteen', 15),
      episode('nine', 9, { publishedAt: stored }),
      episode('fourteen', 14),
    ])

    await runForEpisodes({
      action: 'publish',
      ids: ['twelve', 'fifteen', 'nine', 'fourteen'],
      publishBase: new Date('2026-10-22T10:00:00.000Z'),
    })

    expect(
      handlerMocks.publish.mock.calls.map(([, options]) => [
        options.id,
        options.publishedAt?.toISOString(),
        options.orderedAt,
      ]),
    ).toEqual([
      ['fifteen', '2026-10-22T10:00:00.000Z', undefined],
      ['fourteen', '2026-10-22T09:59:59.000Z', undefined],
      ['twelve', '2026-10-22T09:59:58.000Z', undefined],
      ['nine', undefined, undefined],
    ])
  })

  test('publishes nothing on an unpublished podcast (27f)', async () => {
    findManyMock.mockResolvedValue([episode('a', 3, { podcastState: 'draft' })])

    const result = await runForEpisodes({
      action: 'publish',
      ids: ['a'],
      publishBase: new Date(),
    })

    expect(handlerMocks.publish).not.toHaveBeenCalled()
    expect(result).toMatchObject({ processedCount: 0, skippedCount: 1 })
  })

  test('retracts and archives published episodes', async () => {
    findManyMock.mockResolvedValue([episode('a', 3, { state: 'published' })])

    await runForEpisodes({ action: 'retract', ids: ['a'] })
    await runForEpisodes({ action: 'archive', ids: ['a'] })

    expect(handlerMocks.retract).toHaveBeenCalledOnce()
    expect(handlerMocks.archive).toHaveBeenCalledOnce()
  })

  test('a shared number goes newest first, as the table shows it', async () => {
    findManyMock.mockResolvedValue([
      episode('older', 7, { createdAt: new Date('2026-09-01T00:00:00.000Z') }),
      episode('newer', 7, { createdAt: new Date('2026-10-01T00:00:00.000Z') }),
    ])

    await runForEpisodes({
      action: 'publish',
      ids: ['older', 'newer'],
      publishBase: new Date('2026-10-22T10:00:00.000Z'),
    })

    expect(
      handlerMocks.publish.mock.calls.map(([, options]) => options.id),
    ).toEqual(['newer', 'older'])
  })

  test('a Creator retracts their own episode, never publishes (07c)', async () => {
    getAuthorPermissionContextMock.mockResolvedValue({
      authorId: 'creator',
      can: ({ action }: { action: string }) => ({
        hasAny: false,
        hasOwn: action !== 'publish',
        hasPermission: action !== 'publish',
      }),
      roleLevel: 2,
    })
    findManyMock.mockResolvedValue([episode('own', 3, { state: 'published' })])

    const retracted = await runForEpisodes({ action: 'retract', ids: ['own'] })

    expect(retracted).toMatchObject({ processedCount: 1, skippedCount: 0 })

    findManyMock.mockResolvedValue([episode('draft', 4)])

    const published = await runForEpisodes({
      action: 'publish',
      ids: ['draft'],
      publishBase: new Date(),
    })

    expect(handlerMocks.publish).not.toHaveBeenCalled()
    expect(published).toMatchObject({ processedCount: 0, skippedCount: 1 })
  })
})
