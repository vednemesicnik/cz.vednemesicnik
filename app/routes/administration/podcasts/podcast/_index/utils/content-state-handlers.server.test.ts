import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { podcastContentStateHandlers } from './content-state-handlers.server'

// Pass-through the permission wrapper and mock only the Prisma call we assert on,
// so this exercises the podcast config's applyState and delete guard directly.
const {
  withAuthorPermissionMock,
  episodeDeleteManyMock,
  episodeFindFirstMock,
  loadMissingPodcastContentMock,
  podcastDeleteMock,
  podcastFindUniqueMock,
  podcastFindUniqueOrThrowMock,
  podcastUpdateMock,
  reviewFindFirstMock,
} = vi.hoisted(() => ({
  episodeDeleteManyMock: vi.fn(),
  episodeFindFirstMock: vi.fn(),
  loadMissingPodcastContentMock: vi.fn(),
  podcastDeleteMock: vi.fn(),
  podcastFindUniqueMock: vi.fn(),
  podcastFindUniqueOrThrowMock: vi.fn(),
  podcastUpdateMock: vi.fn(),
  reviewFindFirstMock: vi.fn(),
  withAuthorPermissionMock: vi.fn(),
}))

vi.mock('../../../utils/load-missing-podcast-content.server', () => ({
  loadMissingPodcastContent: loadMissingPodcastContentMock,
}))

// The content log has its own tests; here it only must not reach Prisma.
vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: vi.fn(),
}))

vi.mock('~/utils/content-log/delete-content-log.server', () => ({
  deleteContentLog: vi.fn(),
}))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({
    withAuthorPermission: (
      request: Request,
      options: { execute: (context: unknown) => Promise<unknown> },
    ) => withAuthorPermissionMock(request, options),
  }),
)

vi.mock('~/utils/db.server', () => {
  const prisma = {
    // The transaction runs on the same mocked client.
    $transaction: (run: (transaction: unknown) => Promise<unknown>) =>
      run(prisma),
    podcast: {
      delete: podcastDeleteMock,
      findUnique: podcastFindUniqueMock,
      findUniqueOrThrow: podcastFindUniqueOrThrowMock,
      update: podcastUpdateMock,
    },
    podcastEpisode: {
      deleteMany: episodeDeleteManyMock,
      findFirst: episodeFindFirstMock,
    },
    review: { findFirst: reviewFindFirstMock },
  }

  return { prisma }
})

const request = new Request('https://test.local/')
const target = { authorIds: ['author-1'], state: 'published' as const }

const TAKEN = 'Adresa je obsazená.'

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

// Someone else's live hold, as the podcast or an episode draft stores it.
const heldByMarie = () => ({
  heldByAuthor: { name: 'Marie Horáková' },
  heldByAuthorId: 'author-2',
  heldByTabId: 'tab-1',
  heldSince: new Date(Date.now() - 60_000),
  heldUntil: new Date(Date.now() + 60_000),
})

beforeEach(() => {
  vi.clearAllMocks()
  episodeFindFirstMock.mockResolvedValue(null)
  loadMissingPodcastContentMock.mockResolvedValue([])
  podcastFindUniqueMock.mockResolvedValue({ cover: null })
  podcastUpdateMock.mockResolvedValue(undefined)
  reviewFindFirstMock.mockResolvedValue(null)
  withAuthorPermissionMock.mockImplementation(
    (
      _request: Request,
      options: { execute: (context: unknown) => Promise<unknown> },
    ) => options.execute({ authorId: 'author-1', roleLevel: 1 }),
  )
})

describe('podcastContentStateHandlers — review and submission clearing on transitions', () => {
  test('retract clears all reviews and moves to draft, keeping the date', async () => {
    await podcastContentStateHandlers.retract(request, { id: 'p1', target })

    expect(podcastUpdateMock).toHaveBeenCalledWith({
      data: {
        reviews: { deleteMany: {} },
        state: 'draft',
        submittedAt: null,
        submittedById: null,
      },
      select: { id: true },
      where: { AND: expect.any(Array), id: 'p1' },
    })
  })

  test('restore clears all reviews and moves to draft, keeping the date', async () => {
    await podcastContentStateHandlers.restore(request, { id: 'p1', target })

    expect(podcastUpdateMock).toHaveBeenCalledWith({
      data: {
        reviews: { deleteMany: {} },
        state: 'draft',
        submittedAt: null,
        submittedById: null,
      },
      select: { id: true },
      where: { AND: expect.any(Array), id: 'p1' },
    })
  })

  test('archive keeps reviews intact and ends the hold (07g)', async () => {
    await podcastContentStateHandlers.archive(request, { id: 'p1', target })

    expect(podcastUpdateMock).toHaveBeenCalledWith({
      data: {
        heldByAuthorId: null,
        heldByTabId: null,
        heldSince: null,
        heldUntil: null,
        state: 'archived',
        submittedAt: null,
        submittedById: null,
      },
      select: { id: true },
      where: { AND: expect.any(Array), id: 'p1' },
    })
  })
})

describe('podcastContentStateHandlers — the published address and 27i (log 0039)', () => {
  const draftTarget = { authorIds: ['author-1'], state: 'draft' as const }
  const completePodcast = {
    author: { role: { level: 2 } },
    cover: { id: 'c1' },
    description: 'O škole.',
    publishedAt: null,
    reviews: [],
    slug: 'prestavka',
    submittedAt: null,
    title: 'Přestávka',
  }

  test('publishing writes the typed address as the one the podcast holds', async () => {
    podcastFindUniqueOrThrowMock.mockResolvedValue(completePodcast)

    await podcastContentStateHandlers.publish(request, {
      id: 'p1',
      target: draftTarget,
    })

    expect(podcastUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publishedSlug: 'prestavka',
          state: 'published',
        }),
        where: expect.objectContaining({ AND: expect.any(Array), id: 'p1' }),
      }),
    )
  })

  test('refuses a publish of an incomplete podcast and writes nothing', async () => {
    podcastFindUniqueOrThrowMock.mockResolvedValue(completePodcast)
    loadMissingPodcastContentMock.mockResolvedValue(['Chybí obálka.'])

    const result = await podcastContentStateHandlers.publish(request, {
      id: 'p1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: ['Chybí obálka.'] })
    expect(podcastUpdateMock).not.toHaveBeenCalled()
  })

  test('rechecks inside the transaction: a cover gone since is missing', async () => {
    podcastFindUniqueOrThrowMock.mockResolvedValue({
      ...completePodcast,
      cover: null,
    })

    const result = await podcastContentStateHandlers.publish(request, {
      id: 'p1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: ['Chybí obálka.'] })
    expect(podcastUpdateMock).not.toHaveBeenCalled()
  })

  test('an address taken since the check comes back as missing content', async () => {
    podcastFindUniqueOrThrowMock.mockResolvedValue(completePodcast)
    podcastUpdateMock.mockRejectedValueOnce(uniqueConstraintError())

    const result = await podcastContentStateHandlers.publish(request, {
      id: 'p1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: [TAKEN] })
  })

  test('refuses an approval under a taken address', async () => {
    podcastFindUniqueOrThrowMock.mockResolvedValue({
      ...completePodcast,
      submittedAt: new Date('2026-10-26T10:00:00Z'),
    })
    loadMissingPodcastContentMock.mockResolvedValue([TAKEN])

    const result = await podcastContentStateHandlers.review(request, {
      id: 'p1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: [TAKEN] })
    expect(podcastUpdateMock).not.toHaveBeenCalled()
  })

  test('retracting keeps the address the podcast holds', async () => {
    await podcastContentStateHandlers.retract(request, { id: 'p1', target })

    expect(podcastUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          publishedSlug: expect.anything(),
        }),
      }),
    )
  })
})

describe('podcastContentStateHandlers — the edit hold (logs 0019, 0036)', () => {
  test('refuses a transition while someone else edits the podcast', async () => {
    podcastUpdateMock.mockRejectedValueOnce(notFoundError())
    podcastFindUniqueMock.mockResolvedValue(heldByMarie())

    await expect(
      podcastContentStateHandlers.retract(request, { id: 'p1', target }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Marie Horáková', isOwnOtherTab: false },
    })
  })
})

describe('podcastContentStateHandlers — delete', () => {
  const draftTarget = { authorIds: ['author-1'], state: 'draft' as const }
  const publishState = {
    author: { role: { level: 3 } },
    publishedAt: null,
    reviews: [],
  }

  test('refuses a submitted draft', async () => {
    podcastFindUniqueOrThrowMock.mockResolvedValue({
      ...publishState,
      submittedAt: new Date('2026-10-13T10:00:00Z'),
    })

    await expect(
      podcastContentStateHandlers.delete(request, {
        id: 'p1',
        target: draftTarget,
      }),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(podcastDeleteMock).not.toHaveBeenCalled()
  })

  test('deletes an unsubmitted draft', async () => {
    podcastFindUniqueOrThrowMock.mockResolvedValue({
      ...publishState,
      submittedAt: null,
    })

    await podcastContentStateHandlers.delete(request, {
      id: 'p1',
      target: draftTarget,
    })

    // Not while any editor holds it (log 0036).
    expect(podcastDeleteMock).toHaveBeenCalledWith({
      where: { AND: expect.any(Array), id: 'p1' },
    })
  })

  test('waits for an editor that holds the podcast itself (log 0036)', async () => {
    podcastFindUniqueOrThrowMock.mockResolvedValue({
      ...publishState,
      submittedAt: null,
    })
    podcastDeleteMock.mockRejectedValueOnce(notFoundError())
    podcastFindUniqueMock.mockResolvedValue({ cover: null, ...heldByMarie() })

    await expect(
      podcastContentStateHandlers.delete(request, {
        id: 'p1',
        target: draftTarget,
      }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Marie Horáková', isOwnOtherTab: false },
    })
  })

  test("takes the podcast's free empty episode drafts along (log 0020)", async () => {
    podcastFindUniqueOrThrowMock.mockResolvedValue({
      ...publishState,
      submittedAt: null,
    })

    await podcastContentStateHandlers.delete(request, {
      id: 'p1',
      target: draftTarget,
    })

    expect(episodeDeleteManyMock).toHaveBeenCalledWith({
      where: expect.objectContaining({
        AND: expect.any(Array),
        firstContentAt: null,
        podcastId: 'p1',
        state: 'draft',
      }),
    })
    expect(episodeDeleteManyMock.mock.invocationCallOrder[0]).toBeLessThan(
      podcastDeleteMock.mock.invocationCallOrder[0],
    )
  })

  test('waits for an editor that holds an empty episode draft (log 0036)', async () => {
    podcastFindUniqueOrThrowMock.mockResolvedValue({
      ...publishState,
      submittedAt: null,
    })
    episodeFindFirstMock.mockResolvedValue(heldByMarie())

    // The refusal names the episode's editor, not the podcast's.
    await expect(
      podcastContentStateHandlers.delete(request, {
        id: 'p1',
        target: draftTarget,
      }),
    ).rejects.toMatchObject({
      data: {
        content: 'episode',
        heldByName: 'Marie Horáková',
        isOwnOtherTab: false,
      },
    })
    expect(podcastDeleteMock).not.toHaveBeenCalled()
  })
})
