import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { episodeContentStateHandlers } from './content-state-handlers.server'

// Pass-through permission wrapper as the Coordinator, mocked Prisma, and the
// podcast's state through its loader (27f).
const mocks = vi.hoisted(() => ({
  episodeFindUniqueOrThrow: vi.fn(),
  episodeUpdate: vi.fn(),
  loadTakenEpisodeSlugItems: vi.fn(),
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

vi.mock('../../../utils/load-taken-episode-slug-items.server', () => ({
  loadTakenEpisodeSlugItems: mocks.loadTakenEpisodeSlugItems,
}))

vi.mock('../../../utils/load-unpublished-podcast-items.server', () => ({
  loadUnpublishedPodcastItems: mocks.loadUnpublishedPodcastItems,
}))

vi.mock('~/utils/db.server', () => {
  const prisma = {
    // The transaction runs on the same mocked client.
    $transaction: (run: (transaction: unknown) => Promise<unknown>) =>
      run(prisma),
    podcastEpisode: {
      findUniqueOrThrow: mocks.episodeFindUniqueOrThrow,
      update: mocks.episodeUpdate,
    },
    review: {
      create: mocks.reviewCreate,
      findFirst: mocks.reviewFindFirst,
    },
  }

  return { prisma }
})

const request = new Request('https://test.local/')
const draftTarget = { authorIds: ['creator'], state: 'draft' as const }

const notPublished = 'Podcast Přestávka není publikovaný.'
const TAKEN = 'Adresa je obsazená.'

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
    slug: 'uvod',
    state: 'draft',
    submittedAt: null,
  })
  mocks.loadTakenEpisodeSlugItems.mockResolvedValue([])
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

describe('episodeContentStateHandlers — the published address (log 0039)', () => {
  test('publishing writes the typed address as the one the episode holds', async () => {
    await episodeContentStateHandlers.publish(request, {
      id: 'e1',
      target: draftTarget,
    })

    expect(mocks.episodeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publishedSlug: 'uvod',
          state: 'published',
        }),
        where: { id: 'e1' },
      }),
    )
  })

  test('refuses a publish under a taken address and writes nothing', async () => {
    mocks.loadTakenEpisodeSlugItems.mockResolvedValue([TAKEN])

    const result = await episodeContentStateHandlers.publish(request, {
      id: 'e1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: [TAKEN] })
    expect(mocks.episodeUpdate).not.toHaveBeenCalled()
  })

  test('an address taken since the check comes back as missing content', async () => {
    mocks.episodeUpdate.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        clientVersion: 'test',
        code: 'P2002',
      }),
    )

    const result = await episodeContentStateHandlers.publish(request, {
      id: 'e1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: [TAKEN] })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })

  test('refuses an approval under a taken address', async () => {
    mocks.episodeFindUniqueOrThrow.mockResolvedValue({
      author: { id: 'creator', role: { level: 2 } },
      publishedAt: null,
      reviews: [],
      slug: 'uvod',
      state: 'draft',
      submittedAt: new Date('2026-10-26T10:00:00Z'),
    })
    mocks.loadTakenEpisodeSlugItems.mockResolvedValue([TAKEN])

    const result = await episodeContentStateHandlers.review(request, {
      id: 'e1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: [TAKEN] })
    expect(mocks.reviewCreate).not.toHaveBeenCalled()
  })

  test('retracting keeps the address the episode holds', async () => {
    await episodeContentStateHandlers.retract(request, {
      id: 'e1',
      target: { ...draftTarget, state: 'published' },
    })

    expect(mocks.episodeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ publishedSlug: expect.anything() }),
      }),
    )
  })
})
