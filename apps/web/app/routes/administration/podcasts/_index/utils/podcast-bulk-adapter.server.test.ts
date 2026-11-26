import { beforeEach, describe, expect, test, vi } from 'vitest'

import { runBulkContentAction } from '~/utils/bulk-action/run-bulk-content-action.server'

import { podcastBulkAdapter } from './podcast-bulk-adapter.server'

// The database read, the permission context and the state transitions are
// mocked; eligibility (flags → podcast actions → bulk actions) runs for real.
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
  prisma: { podcast: { findMany: findManyMock } },
}))

vi.mock(
  '~/utils/permissions/author/context/get-author-permission-context.server',
  () => ({ getAuthorPermissionContext: getAuthorPermissionContextMock }),
)

vi.mock('../../podcast/_index/utils/content-state-handlers.server', () => ({
  podcastContentStateHandlers: handlerMocks,
}))

const request = new Request('https://test.local/')

const podcast = (
  id: string,
  state: 'draft' | 'published' | 'archived',
  {
    episodeCount = 0,
    publishedEpisodeCount = 0,
    publishedAt = null as Date | null,
  } = {},
) => ({
  _count: { episodes: episodeCount },
  author: { id: 'creator', role: { level: 2 } },
  episodes: Array.from({ length: publishedEpisodeCount }, (_, index) => ({
    id: `${id}-episode-${index}`,
  })),
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
  id,
  publishedAt,
  reviews: [],
  state,
  submittedAt: null,
})

const runForPodcasts = (
  options: Omit<Parameters<typeof runBulkContentAction>[1], 'adapter'>,
) => runBulkContentAction(request, { ...options, adapter: podcastBulkAdapter })

beforeEach(() => {
  vi.clearAllMocks()
  getAuthorPermissionContextMock.mockResolvedValue({
    authorId: 'coordinator',
    can: () => ({ hasAny: true, hasOwn: false, hasPermission: true }),
    roleLevel: 1,
  })
  handlerMocks.publish.mockResolvedValue({ missing: [] })
})

describe('podcastBulkAdapter (27a)', () => {
  test('spaces never-published podcasts a second apart in list order, keeps a stored date', async () => {
    const stored = new Date('2025-02-03T10:00:00.000Z')
    findManyMock.mockResolvedValue([
      podcast('top', 'draft'),
      podcast('returning', 'draft', { publishedAt: stored }),
      podcast('next', 'draft'),
    ])

    await runForPodcasts({
      action: 'publish',
      ids: ['top', 'returning', 'next'],
    })

    const calls = handlerMocks.publish.mock.calls.map(([, options]) => options)
    expect(calls.map((options) => options.id)).toEqual([
      'top',
      'returning',
      'next',
    ])
    expect(calls.every((options) => options.publishedAt === undefined)).toBe(
      true,
    )
    const [top, returning, next] = calls.map((options) => options.orderedAt)
    expect(returning).toBeUndefined()
    expect(top?.getTime()).toBe((next?.getTime() ?? 0) + 1000)
  })

  test('never deletes a podcast with episodes (27f)', async () => {
    findManyMock.mockResolvedValue([
      podcast('empty', 'archived'),
      podcast('with-episodes', 'archived', { episodeCount: 3 }),
    ])

    const result = await runForPodcasts({
      action: 'delete',
      ids: ['empty', 'with-episodes'],
    })

    expect(
      handlerMocks.delete.mock.calls.map(([, options]) => options.id),
    ).toEqual(['empty'])
    expect(result).toMatchObject({ processedCount: 1, skippedCount: 1 })
  })

  test('says when a retracted podcast took published episodes with it', async () => {
    findManyMock.mockResolvedValue([
      podcast('a', 'published', {
        episodeCount: 11,
        publishedEpisodeCount: 11,
      }),
    ])

    const result = await runForPodcasts({ action: 'retract', ids: ['a'] })

    expect(result).toMatchObject({ hasRelated: true, processedCount: 1 })
  })

  test('a podcast without published episodes took none', async () => {
    findManyMock.mockResolvedValue([
      podcast('a', 'published', { episodeCount: 2 }),
    ])

    const result = await runForPodcasts({ action: 'archive', ids: ['a'] })

    expect(result).toMatchObject({ hasRelated: false, processedCount: 1 })
  })
})
