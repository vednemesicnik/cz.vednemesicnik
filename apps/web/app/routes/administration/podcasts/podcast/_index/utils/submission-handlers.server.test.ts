import { beforeEach, describe, expect, test, vi } from 'vitest'

import { podcastSubmissionHandlers } from './submission-handlers.server'

// Pass-through permission wrapper as the Creator, mocked Prisma, and what is
// missing through its loader (27i).
const mocks = vi.hoisted(() => ({
  loadMissingPodcastContent: vi.fn(),
  permissionContext: vi.fn(),
  podcastFindUnique: vi.fn(),
  podcastFindUniqueOrThrow: vi.fn(),
  podcastUpdateMany: vi.fn(),
  publishContentEvent: vi.fn(),
  recordContentLog: vi.fn(),
}))

vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: mocks.recordContentLog,
}))

vi.mock('~/utils/sse/publish-content-event.server', () => ({
  publishContentEvent: mocks.publishContentEvent,
}))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({
    withAuthorPermission: (
      _request: Request,
      options: { execute: (context: unknown) => Promise<unknown> },
    ) => options.execute(mocks.permissionContext()),
  }),
)

vi.mock('../../../utils/load-missing-podcast-content.server', () => ({
  loadMissingPodcastContent: mocks.loadMissingPodcastContent,
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    podcast: {
      findUnique: mocks.podcastFindUnique,
      findUniqueOrThrow: mocks.podcastFindUniqueOrThrow,
      updateMany: mocks.podcastUpdateMany,
    },
  },
}))

const request = new Request('https://test.local/')
const target = { authorIds: ['creator'], state: 'draft' as const }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.permissionContext.mockReturnValue({
    authorId: 'creator',
    roleLevel: 2,
  })
  mocks.podcastFindUniqueOrThrow.mockResolvedValue({
    author: { id: 'creator', role: { level: 2 } },
    state: 'draft',
    submittedAt: null,
  })
  mocks.podcastUpdateMany.mockResolvedValue({ count: 1 })
  mocks.podcastFindUnique.mockResolvedValue(null)
  mocks.loadMissingPodcastContent.mockResolvedValue([])
})

describe('podcastSubmissionHandlers — submit an incomplete podcast (27i)', () => {
  test('refuses it, the taken address after what is missing, and records no submission', async () => {
    mocks.loadMissingPodcastContent.mockResolvedValue([
      'Chybí obálka.',
      'Adresa je obsazená.',
    ])

    const result = await podcastSubmissionHandlers.submit(request, {
      id: 'p1',
      target,
    })

    expect(result).toEqual({
      missing: ['Chybí obálka.', 'Adresa je obsazená.'],
    })
    expect(mocks.podcastUpdateMany).not.toHaveBeenCalled()
  })
})

describe('podcastSubmissionHandlers — the edit hold (log 0019)', () => {
  test('submits only while nobody else edits it, and ends one’s own hold', async () => {
    const result = await podcastSubmissionHandlers.submit(request, {
      id: 'p1',
      target,
    })

    expect(result).toEqual({ missing: [] })
    expect(mocks.podcastUpdateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({
        heldByAuthorId: null,
        heldByTabId: null,
        heldSince: null,
        heldUntil: null,
        submittedById: 'creator',
      }),
      where: expect.objectContaining({
        AND: expect.any(Array),
        id: 'p1',
        state: 'draft',
        submittedAt: null,
      }),
    })
  })

  test('refuses it while someone else edits the podcast', async () => {
    mocks.podcastUpdateMany.mockResolvedValue({ count: 0 })
    mocks.podcastFindUnique.mockResolvedValue({
      heldByAuthor: { name: 'Marie Horáková' },
      heldByAuthorId: 'coordinator',
      heldByTabId: 'tab-1',
      heldSince: new Date(Date.now() - 60_000),
      heldUntil: new Date(Date.now() + 60_000),
    })

    await expect(
      podcastSubmissionHandlers.submit(request, { id: 'p1', target }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Marie Horáková', isOwnOtherTab: false },
    })
  })
})
