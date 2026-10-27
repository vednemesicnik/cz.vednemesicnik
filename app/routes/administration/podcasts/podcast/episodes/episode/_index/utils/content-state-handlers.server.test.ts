import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { episodeContentStateHandlers } from './content-state-handlers.server'

// Pass-through permission wrapper as the Coordinator, mocked Prisma, and the
// podcast's state through its loader (27f).
const mocks = vi.hoisted(() => ({
  episodeDelete: vi.fn(),
  episodeFindUnique: vi.fn(),
  episodeFindUniqueOrThrow: vi.fn(),
  episodeUpdate: vi.fn(),
  loadMissingEpisodeContent: vi.fn(),
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

vi.mock('../../../utils/load-missing-episode-content.server', () => ({
  loadMissingEpisodeContent: mocks.loadMissingEpisodeContent,
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteRowWithImages: async (
    _loadImageIds: () => Promise<string[]>,
    deleteRow: () => Promise<unknown>,
  ) => deleteRow(),
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
      delete: mocks.episodeDelete,
      findUnique: mocks.episodeFindUnique,
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
const NO_LINK = 'Chybí odkaz na epizodu.'
const TAKEN = 'Adresa je obsazená.'
const TAKEN_NUMBER = 'Číslo 13 je obsazené.'

const uniqueConstraintError = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    clientVersion: 'test',
    code: 'P2002',
  })

const notFoundError = () =>
  new Prisma.PrismaClientKnownRequestError('Record not found', {
    clientVersion: 'test',
    code: 'P2025',
  })

beforeEach(() => {
  vi.clearAllMocks()
  mocks.permissionContext.mockReturnValue({
    authorId: 'coordinator',
    roleLevel: 1,
  })
  mocks.episodeFindUniqueOrThrow.mockResolvedValue({
    author: { id: 'creator', role: { level: 2 } },
    description: 'Popis',
    links: [{ label: 'Spotify', url: 'https://open.spotify.com/episode/1' }],
    number: 13,
    publishedAt: null,
    reviews: [],
    slug: 'uvod',
    state: 'draft',
    submittedAt: null,
    title: 'Úvod',
  })
  mocks.episodeFindUnique.mockResolvedValue(null)
  mocks.loadMissingEpisodeContent.mockResolvedValue([])
  mocks.loadUnpublishedPodcastItems.mockResolvedValue([])
})

describe('episodeContentStateHandlers — an episode without a link (27h)', () => {
  test('refuses a publish and writes nothing', async () => {
    mocks.loadMissingEpisodeContent.mockResolvedValue([NO_LINK])

    const result = await episodeContentStateHandlers.publish(request, {
      id: 'e1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: [NO_LINK] })
    expect(mocks.episodeUpdate).not.toHaveBeenCalled()
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })

  test('refuses an approval, the missing link said before the address', async () => {
    mocks.episodeFindUniqueOrThrow.mockResolvedValue({
      author: { id: 'creator', role: { level: 2 } },
      publishedAt: null,
      reviews: [],
      slug: 'uvod',
      state: 'draft',
      submittedAt: new Date('2026-10-26T10:00:00Z'),
    })
    mocks.loadMissingEpisodeContent.mockResolvedValue([NO_LINK, TAKEN])

    const result = await episodeContentStateHandlers.review(request, {
      id: 'e1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: [NO_LINK, TAKEN] })
    expect(mocks.reviewCreate).not.toHaveBeenCalled()
  })
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
        where: expect.objectContaining({ id: 'e1' }),
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

describe('episodeContentStateHandlers — the published number and address (log 0039)', () => {
  test('publishing writes the typed number and address as the ones the episode holds', async () => {
    await episodeContentStateHandlers.publish(request, {
      id: 'e1',
      target: draftTarget,
    })

    expect(mocks.episodeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publishedNumber: 13,
          publishedSlug: 'uvod',
          state: 'published',
        }),
        where: expect.objectContaining({ id: 'e1' }),
      }),
    )
  })

  test('refuses a publish under a taken address and writes nothing', async () => {
    mocks.loadMissingEpisodeContent.mockResolvedValue([TAKEN])

    const result = await episodeContentStateHandlers.publish(request, {
      id: 'e1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: [TAKEN] })
    expect(mocks.episodeUpdate).not.toHaveBeenCalled()
  })

  test('an address taken since the check comes back as missing content', async () => {
    mocks.episodeUpdate.mockRejectedValueOnce(uniqueConstraintError())

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
    mocks.loadMissingEpisodeContent.mockResolvedValue([TAKEN])

    const result = await episodeContentStateHandlers.review(request, {
      id: 'e1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: [TAKEN] })
    expect(mocks.reviewCreate).not.toHaveBeenCalled()
  })

  test('retracting keeps the number and address the episode holds', async () => {
    await episodeContentStateHandlers.retract(request, {
      id: 'e1',
      target: { ...draftTarget, state: 'published' },
    })

    expect(mocks.episodeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          publishedNumber: expect.anything(),
          publishedSlug: expect.anything(),
        }),
      }),
    )
  })
})

describe('episodeContentStateHandlers — a number taken since the check (log 0039)', () => {
  test('comes back as the taken number', async () => {
    mocks.episodeUpdate.mockRejectedValueOnce(uniqueConstraintError())
    mocks.loadMissingEpisodeContent
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([TAKEN_NUMBER])

    const result = await episodeContentStateHandlers.publish(request, {
      id: 'e1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: [TAKEN_NUMBER] })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })
})

describe('episodeContentStateHandlers — the edit hold (logs 0019, 0036)', () => {
  test('a transition repeats that nobody else holds the episode', async () => {
    await episodeContentStateHandlers.retract(request, {
      id: 'e1',
      target: { ...draftTarget, state: 'published' },
    })

    expect(mocks.episodeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ AND: expect.any(Array), id: 'e1' }),
      }),
    )
  })

  test('refuses a transition while someone else edits the episode', async () => {
    mocks.episodeUpdate.mockRejectedValueOnce(notFoundError())
    mocks.episodeFindUnique.mockResolvedValue({
      heldByAuthor: { name: 'Marie Horáková' },
      heldByAuthorId: 'creator',
      heldByTabId: 'tab-1',
      heldSince: new Date(Date.now() - 60_000),
      heldUntil: new Date(Date.now() + 60_000),
    })

    await expect(
      episodeContentStateHandlers.retract(request, {
        id: 'e1',
        target: { ...draftTarget, state: 'published' },
      }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Marie Horáková', isOwnOtherTab: false },
    })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })

  test("a delete waits for every open editor, one's own included", async () => {
    mocks.episodeDelete.mockRejectedValueOnce(notFoundError())
    mocks.episodeFindUnique.mockResolvedValue({
      heldByAuthor: { name: 'Jakub Novák' },
      heldByAuthorId: 'coordinator',
      heldByTabId: 'tab-2',
      heldSince: new Date(Date.now() - 60_000),
      heldUntil: new Date(Date.now() + 60_000),
    })

    await expect(
      episodeContentStateHandlers.delete(request, {
        id: 'e1',
        target: draftTarget,
      }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Jakub Novák', isOwnOtherTab: true },
    })
    expect(mocks.episodeDelete).toHaveBeenCalledWith({
      where: expect.objectContaining({ AND: expect.any(Array), id: 'e1' }),
    })
  })
})

describe('episodeContentStateHandlers — incomplete since the check (27h)', () => {
  test('refuses the publish inside its transaction and writes nothing', async () => {
    mocks.episodeFindUniqueOrThrow.mockResolvedValue({
      author: { id: 'creator', role: { level: 2 } },
      description: 'Popis',
      links: [{ label: '', url: 'https://kabinet.priklad.cz/13' }],
      number: null,
      publishedAt: null,
      reviews: [],
      slug: 'uvod',
      state: 'draft',
      submittedAt: null,
      title: 'Úvod',
    })

    const result = await episodeContentStateHandlers.publish(request, {
      id: 'e1',
      target: draftTarget,
    })

    expect(result).toEqual({
      missing: ['Chybí číslo.', '1 odkaz nemá název platformy.'],
    })
    expect(mocks.episodeUpdate).not.toHaveBeenCalled()
  })
})
