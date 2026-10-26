import { beforeEach, describe, expect, test, vi } from 'vitest'

import { episodeSubmissionHandlers } from './submission-handlers.server'

// Pass-through permission wrapper as the Creator, mocked Prisma, and the
// podcast's state through its loader (27f).
const mocks = vi.hoisted(() => ({
  episodeFindUniqueOrThrow: vi.fn(),
  episodeUpdateMany: vi.fn(),
  loadUnpublishedPodcastItems: vi.fn(),
  permissionContext: vi.fn(),
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

vi.mock('../../../utils/load-unpublished-podcast-items.server', () => ({
  loadUnpublishedPodcastItems: mocks.loadUnpublishedPodcastItems,
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    podcastEpisode: {
      findUniqueOrThrow: mocks.episodeFindUniqueOrThrow,
      updateMany: mocks.episodeUpdateMany,
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
  mocks.episodeFindUniqueOrThrow.mockResolvedValue({
    author: { id: 'creator', role: { level: 2 } },
    state: 'draft',
    submittedAt: null,
  })
  mocks.episodeUpdateMany.mockResolvedValue({ count: 1 })
  mocks.loadUnpublishedPodcastItems.mockResolvedValue([])
})

describe('episodeSubmissionHandlers — submit in an unpublished podcast (27f)', () => {
  test('refuses it and records no submission', async () => {
    mocks.loadUnpublishedPodcastItems.mockResolvedValue([
      'Podcast Přestávka není publikovaný.',
    ])

    const result = await episodeSubmissionHandlers.submit(request, {
      id: 'e1',
      target,
    })

    expect(result).toEqual({
      missing: ['Podcast Přestávka není publikovaný.'],
    })
    expect(mocks.episodeUpdateMany).not.toHaveBeenCalled()
  })

  test('submits in a published podcast', async () => {
    const result = await episodeSubmissionHandlers.submit(request, {
      id: 'e1',
      target,
    })

    expect(result).toEqual({ missing: [] })
    expect(mocks.episodeUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'e1', state: 'draft', submittedAt: null },
      }),
    )
  })
})
