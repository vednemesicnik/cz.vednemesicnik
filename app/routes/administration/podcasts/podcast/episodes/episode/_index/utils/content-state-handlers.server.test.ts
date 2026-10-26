import { beforeEach, describe, expect, test, vi } from 'vitest'

import { episodeContentStateHandlers } from './content-state-handlers.server'

// Pass-through permission wrapper as the Coordinator, mocked Prisma, and the
// podcast's state through its loader (27f).
const mocks = vi.hoisted(() => ({
  episodeFindUniqueOrThrow: vi.fn(),
  episodeUpdate: vi.fn(),
  loadUnpublishedPodcastItems: vi.fn(),
  permissionContext: vi.fn(),
  publishContentEvent: vi.fn(),
  recordContentLog: vi.fn(),
  reviewCreate: vi.fn(),
  reviewFindFirst: vi.fn(),
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
      update: mocks.episodeUpdate,
    },
    review: {
      create: mocks.reviewCreate,
      findFirst: mocks.reviewFindFirst,
    },
  },
}))

const request = new Request('https://test.local/')
const draftTarget = { authorIds: ['creator'], state: 'draft' as const }

const notPublished = 'Podcast Přestávka není publikovaný.'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.permissionContext.mockReturnValue({
    authorId: 'coordinator',
    roleLevel: 1,
  })
  mocks.episodeFindUniqueOrThrow.mockResolvedValue({
    author: { id: 'creator', role: { level: 2 } },
    publishedAt: null,
    reviews: [],
    state: 'draft',
    submittedAt: null,
  })
  mocks.loadUnpublishedPodcastItems.mockResolvedValue([])
})

describe('episodeContentStateHandlers — publish in an unpublished podcast (27f)', () => {
  test('refuses it and writes nothing', async () => {
    mocks.loadUnpublishedPodcastItems.mockResolvedValue([notPublished])

    const result = await episodeContentStateHandlers.publish(request, {
      id: 'e1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: [notPublished] })
    expect(mocks.episodeUpdate).not.toHaveBeenCalled()
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })

  test('publishes in a published podcast', async () => {
    const result = await episodeContentStateHandlers.publish(request, {
      id: 'e1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: [] })
    expect(mocks.episodeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ state: 'published' }),
        where: { id: 'e1' },
      }),
    )
  })

  test('still retracts an episode whose podcast is off the web', async () => {
    mocks.loadUnpublishedPodcastItems.mockResolvedValue([notPublished])

    await episodeContentStateHandlers.retract(request, {
      id: 'e1',
      target: { ...draftTarget, state: 'published' },
    })

    expect(mocks.loadUnpublishedPodcastItems).not.toHaveBeenCalled()
    expect(mocks.episodeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ state: 'draft' }),
      }),
    )
  })
})
