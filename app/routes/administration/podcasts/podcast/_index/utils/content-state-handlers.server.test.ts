import { beforeEach, describe, expect, test, vi } from 'vitest'

import { podcastContentStateHandlers } from './content-state-handlers.server'

// Pass-through the permission wrapper and mock only the Prisma call we assert on,
// so this exercises the podcast config's applyState and delete guard directly.
const {
  withAuthorPermissionMock,
  episodeDeleteManyMock,
  episodeFindFirstMock,
  podcastDeleteMock,
  podcastFindUniqueOrThrowMock,
  podcastUpdateMock,
} = vi.hoisted(() => ({
  episodeDeleteManyMock: vi.fn(),
  episodeFindFirstMock: vi.fn(),
  podcastDeleteMock: vi.fn(),
  podcastFindUniqueOrThrowMock: vi.fn(),
  podcastUpdateMock: vi.fn(),
  withAuthorPermissionMock: vi.fn(),
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
      findUnique: vi.fn().mockResolvedValue({ cover: null }),
      findUniqueOrThrow: podcastFindUniqueOrThrowMock,
      update: podcastUpdateMock,
    },
    podcastEpisode: {
      deleteMany: episodeDeleteManyMock,
      findFirst: episodeFindFirstMock,
    },
  }

  return { prisma }
})

const request = new Request('https://test.local/')
const target = { authorIds: ['author-1'], state: 'published' as const }

beforeEach(() => {
  vi.clearAllMocks()
  episodeFindFirstMock.mockResolvedValue(null)
  podcastUpdateMock.mockResolvedValue(undefined)
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
      where: { id: 'p1' },
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
      where: { id: 'p1' },
    })
  })

  test('archive keeps reviews intact', async () => {
    await podcastContentStateHandlers.archive(request, { id: 'p1', target })

    expect(podcastUpdateMock).toHaveBeenCalledWith({
      data: { state: 'archived', submittedAt: null, submittedById: null },
      where: { id: 'p1' },
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

    expect(podcastDeleteMock).toHaveBeenCalledWith({ where: { id: 'p1' } })
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
    episodeFindFirstMock.mockResolvedValue({
      heldByAuthor: { name: 'Marie Horáková' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-1',
      heldSince: new Date(Date.now() - 60_000),
      heldUntil: new Date(Date.now() + 60_000),
    })

    await expect(
      podcastContentStateHandlers.delete(request, {
        id: 'p1',
        target: draftTarget,
      }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Marie Horáková', isOwnOtherTab: false },
    })
    expect(podcastDeleteMock).not.toHaveBeenCalled()
  })
})
