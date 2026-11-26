import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { savePodcastCoverChange } from './save-podcast-cover-change.server'

const mocks = vi.hoisted(() => ({
  permissionContext: vi.fn(),
  podcastFindUnique: vi.fn(),
  podcastFindUniqueOrThrow: vi.fn(),
  podcastUpdate: vi.fn(),
  podcastUpdateMany: vi.fn(),
  publishContentEvent: vi.fn(),
  recordContentLog: vi.fn(),
  recordEditLog: vi.fn(),
  transaction: vi.fn(),
  withAuthorPermission: vi.fn(),
}))

vi.mock('~/utils/content-log/record-edit-log.server', () => ({
  recordEditLog: mocks.recordEditLog,
}))

vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: mocks.recordContentLog,
}))

vi.mock('~/utils/sse/publish-content-event.server', () => ({
  publishContentEvent: mocks.publishContentEvent,
}))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({ withAuthorPermission: mocks.withAuthorPermission }),
)

vi.mock('~/utils/db.server', () => ({
  prisma: {
    $transaction: mocks.transaction,
    podcast: {
      findUnique: mocks.podcastFindUnique,
      findUniqueOrThrow: mocks.podcastFindUniqueOrThrow,
      update: mocks.podcastUpdate,
      updateMany: mocks.podcastUpdateMany,
    },
  },
}))

const request = new Request('https://test.local/')

const ownHold = {
  heldByAuthor: { name: 'Marie Horáková' },
  heldByAuthorId: 'author-1',
  heldByTabId: 'tab-1',
  heldSince: new Date(Date.now() - 60_000),
  heldUntil: new Date(Date.now() + 60_000),
}

const releasedHold = {
  heldByAuthor: null,
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
}

const storedPodcast = {
  authorId: 'author-1',
  cover: null,
  firstContentAt: new Date('2026-10-27T10:00:00Z'),
  ...ownHold,
  state: 'draft',
  submittedAt: null,
  title: 'Přestávka',
}

const savedAt = new Date('2026-10-27T12:00:00Z')
const previousSavedAt = new Date('2026-10-27T11:00:00Z')

type Prepare = Parameters<typeof savePodcastCoverChange>[1]['prepare']

// The writes are tags standing in for Prisma operations.
const buildPrepare = (overrides: Record<string, unknown> = {}) =>
  vi.fn<Prepare>(
    async () =>
      ({ isUpload: true, writes: ['cover-write'], ...overrides }) as never,
  )

const options = {
  podcastId: 'podcast-1',
  tabId: 'tab-1',
}

const notFoundError = () =>
  new Prisma.PrismaClientKnownRequestError('No record', {
    clientVersion: 'test',
    code: 'P2025',
  })

const answerTransaction = (firstContentCount: number) =>
  mocks.transaction.mockImplementation(async (writes: unknown[]) =>
    writes.map((write) =>
      write === 'update-podcast'
        ? { updatedAt: savedAt }
        : write === 'read-previous'
          ? { updatedAt: previousSavedAt }
          : write === 'mark-first-content'
            ? { count: firstContentCount }
            : {},
    ),
  )

beforeEach(() => {
  vi.clearAllMocks()
  mocks.permissionContext.mockReturnValue({
    authorId: 'author-1',
    authorName: 'Marie Horáková',
    roleLevel: 1,
  })
  mocks.withAuthorPermission.mockImplementation(
    (
      _request: Request,
      { execute }: { execute: (context: unknown) => Promise<unknown> },
    ) => execute(mocks.permissionContext()),
  )
  mocks.podcastFindUnique.mockResolvedValue(storedPodcast)
  mocks.podcastUpdate.mockReturnValue('update-podcast')
  mocks.podcastUpdateMany.mockReturnValue('mark-first-content')
  mocks.podcastFindUniqueOrThrow.mockReturnValue('read-previous')
  answerTransaction(0)
})

describe('savePodcastCoverChange — the podcast and the permission', () => {
  test('answers deleted for a missing podcast, before anything is stored', async () => {
    mocks.podcastFindUnique.mockResolvedValue(null)
    const prepare = buildPrepare()

    expect(
      await savePodcastCoverChange(request, { ...options, prepare }),
    ).toEqual({ status: 'deleted' })
    expect(prepare).not.toHaveBeenCalled()
  })

  test('checks the stored author and state', async () => {
    mocks.podcastFindUnique.mockResolvedValue({
      ...storedPodcast,
      authorId: 'author-2',
      state: 'published',
    })

    await savePodcastCoverChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(mocks.withAuthorPermission).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        action: 'update',
        entity: 'podcast',
        target: { authorIds: ['author-2'], state: 'published' },
      }),
    )
  })

  test('answers 403 for a submitted podcast locked for its author', async () => {
    mocks.permissionContext.mockReturnValue({
      authorId: 'author-1',
      roleLevel: 3,
    })
    mocks.podcastFindUnique.mockResolvedValue({
      ...storedPodcast,
      submittedAt: new Date(),
    })

    await expect(
      savePodcastCoverChange(request, { ...options, prepare: buildPrepare() }),
    ).rejects.toMatchObject({ init: { status: 403 } })
  })
})

describe('savePodcastCoverChange — the edit hold', () => {
  test('writes nothing when another author holds the podcast', async () => {
    mocks.podcastFindUnique.mockResolvedValue({
      ...storedPodcast,
      heldByAuthor: { name: 'Ondřej Beneš' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-9',
    })
    const prepare = buildPrepare()

    const result = await savePodcastCoverChange(request, {
      ...options,
      landsWithoutHold: true,
      prepare,
    })

    expect(result).toEqual({ heldByName: 'Ondřej Beneš', status: 'not-held' })
    expect(prepare).not.toHaveBeenCalled()
  })

  test('a released draft refuses a change that needs the hold', async () => {
    mocks.podcastFindUnique.mockResolvedValue({
      ...storedPodcast,
      ...releasedHold,
    })
    const prepare = buildPrepare()

    expect(
      await savePodcastCoverChange(request, { ...options, prepare }),
    ).toEqual({ heldByName: null, status: 'not-held' })
    expect(prepare).not.toHaveBeenCalled()
  })

  test('an upload on its way still lands on a released draft', async () => {
    mocks.podcastFindUnique.mockResolvedValue({
      ...storedPodcast,
      ...releasedHold,
    })

    const result = await savePodcastCoverChange(request, {
      ...options,
      landsWithoutHold: true,
      prepare: buildPrepare(),
    })

    expect(result).toEqual({ status: 'saved', updatedAt: savedAt })
    expect(mocks.podcastUpdate.mock.lastCall?.[0].where).toEqual({
      id: 'podcast-1',
      OR: [
        { heldByAuthorId: 'author-1', heldByTabId: 'tab-1' },
        { heldByTabId: null },
      ],
      state: 'draft',
    })
  })

  test('the write checks the hold again', async () => {
    await savePodcastCoverChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(mocks.podcastUpdate.mock.lastCall?.[0].where).toEqual({
      heldByAuthorId: 'author-1',
      heldByTabId: 'tab-1',
      id: 'podcast-1',
      state: 'draft',
    })
  })

  test('drops the stored files and says who holds it when the hold moved before the write', async () => {
    mocks.transaction.mockRejectedValue(notFoundError())
    mocks.podcastFindUnique.mockResolvedValueOnce(storedPodcast)
    mocks.podcastFindUnique.mockResolvedValueOnce({
      ...storedPodcast,
      heldByAuthor: { name: 'Ondřej Beneš' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-9',
    })
    const onRefused = vi.fn(async () => {})

    const result = await savePodcastCoverChange(request, {
      ...options,
      prepare: buildPrepare({ onRefused }),
    })

    expect(result).toEqual({ heldByName: 'Ondřej Beneš', status: 'not-held' })
    expect(onRefused).toHaveBeenCalledOnce()
  })

  test('still says who holds it when dropping the stored files fails', async () => {
    mocks.transaction.mockRejectedValue(notFoundError())
    mocks.podcastFindUnique.mockResolvedValueOnce(storedPodcast)
    mocks.podcastFindUnique.mockResolvedValueOnce({
      ...storedPodcast,
      heldByAuthor: { name: 'Ondřej Beneš' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-9',
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = await savePodcastCoverChange(request, {
      ...options,
      prepare: buildPrepare({
        onRefused: async () => {
          throw new Error('store down')
        },
      }),
    })

    expect(result).toEqual({ heldByName: 'Ondřej Beneš', status: 'not-held' })
    consoleError.mockRestore()
  })

  test('answers deleted when a new cover’s row failed on the podcast gone meanwhile', async () => {
    mocks.transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Foreign key', {
        clientVersion: 'test',
        code: 'P2003',
      }),
    )
    mocks.podcastFindUnique.mockResolvedValueOnce(storedPodcast)
    mocks.podcastFindUnique.mockResolvedValueOnce(null)
    const onRefused = vi.fn(async () => {})

    expect(
      await savePodcastCoverChange(request, {
        ...options,
        prepare: buildPrepare({ onRefused }),
      }),
    ).toEqual({ status: 'deleted' })
    expect(onRefused).toHaveBeenCalledOnce()
  })

  test('rethrows another failure while the podcast is there', async () => {
    const failure = new Error('disk full')
    mocks.transaction.mockRejectedValue(failure)

    await expect(
      savePodcastCoverChange(request, {
        ...options,
        prepare: buildPrepare(),
      }),
    ).rejects.toBe(failure)
  })

  test('answers deleted when the podcast went before the write', async () => {
    mocks.transaction.mockRejectedValue(notFoundError())
    mocks.podcastFindUnique.mockResolvedValueOnce(storedPodcast)
    mocks.podcastFindUnique.mockResolvedValueOnce(null)

    expect(
      await savePodcastCoverChange(request, {
        ...options,
        prepare: buildPrepare(),
      }),
    ).toEqual({ status: 'deleted' })
  })
})

describe('savePodcastCoverChange — the save and the history', () => {
  test('a failure from prepare is the answer, and nothing is written', async () => {
    const result = await savePodcastCoverChange(request, {
      ...options,
      prepare: vi.fn<Prepare>(async () => ({
        reason: 'over-pixel-budget',
        status: 'failed',
      })),
    })

    expect(result).toEqual({ reason: 'over-pixel-budget', status: 'failed' })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('an upload is *Obálka nahrána* and tells the open lists', async () => {
    const onCommitted = vi.fn(async () => {})

    await savePodcastCoverChange(request, {
      ...options,
      prepare: buildPrepare({ onCommitted }),
    })

    expect(onCommitted).toHaveBeenCalledOnce()
    expect(mocks.recordEditLog).not.toHaveBeenCalled()
    expect(mocks.recordContentLog).toHaveBeenCalledWith(
      {
        entity: 'podcast',
        entityId: 'podcast-1',
        events: ['cover_uploaded'],
      },
      expect.anything(),
    )
    expect(mocks.publishContentEvent).toHaveBeenCalledWith(
      { change: 'update', entity: 'podcast', entityId: 'podcast-1' },
      expect.anything(),
    )
  })

  test('the first content of an empty draft is its creation', async () => {
    answerTransaction(1)

    await savePodcastCoverChange(request, {
      ...options,
      prepare: buildPrepare({ addsContent: true }),
    })

    expect(mocks.transaction.mock.lastCall?.[0]).toEqual([
      'mark-first-content',
      'cover-write',
      'update-podcast',
    ])
    expect(mocks.recordEditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ entity: 'podcast', isCreation: true }),
    )
    // The creation's log told the open lists.
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('a removal is one *Upraveno* per hold', async () => {
    await savePodcastCoverChange(request, {
      ...options,
      prepare: buildPrepare({ isUpload: false }),
    })

    expect(mocks.recordEditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ isCreation: false }),
    )
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('a removal of no cover logs nothing', async () => {
    await savePodcastCoverChange(request, {
      ...options,
      prepare: buildPrepare({ isUpload: false, writes: [] }),
    })

    expect(mocks.recordEditLog).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })
})

describe('savePodcastCoverChange — a cancellable change (bxy8xxqs)', () => {
  const buildCancellable = () => {
    const controller = new AbortController()
    const cancellableRequest = new Request('https://test.local/', {
      signal: controller.signal,
    })
    return { cancel: () => controller.abort(), cancellableRequest }
  }

  test('a cancel before the files are stored runs nothing', async () => {
    const { cancel, cancellableRequest } = buildCancellable()
    cancel()
    const prepare = buildPrepare()

    const result = await savePodcastCoverChange(cancellableRequest, {
      ...options,
      isCancellable: true,
      prepare,
    })

    expect(result).toEqual({ status: 'cancelled' })
    expect(prepare).not.toHaveBeenCalled()
  })

  test('an aborted request is no cancel for a change that is not cancellable', async () => {
    const { cancel, cancellableRequest } = buildCancellable()
    cancel()

    const result = await savePodcastCoverChange(cancellableRequest, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(result).toEqual({ status: 'saved', updatedAt: savedAt })
  })

  test('a cancel while the files are stored drops them and commits nothing', async () => {
    const { cancel, cancellableRequest } = buildCancellable()
    const onRefused = vi.fn(async () => undefined)
    const prepare = vi.fn<Prepare>(async () => {
      cancel()
      return { isUpload: true, onRefused, writes: ['cover-write'] } as never
    })

    const result = await savePodcastCoverChange(cancellableRequest, {
      ...options,
      isCancellable: true,
      prepare,
    })

    expect(result).toEqual({ status: 'cancelled' })
    expect(onRefused).toHaveBeenCalledOnce()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('a cancel during the commit puts things back and logs nothing', async () => {
    const { cancel, cancellableRequest } = buildCancellable()
    mocks.podcastFindUnique.mockResolvedValue({
      ...storedPodcast,
      firstContentAt: null,
    })
    answerTransaction(1)
    const answer = mocks.transaction.getMockImplementation()
    mocks.transaction.mockImplementation(async (writes: unknown[]) => {
      cancel()
      return answer?.(writes)
    })
    const onCancelled = vi.fn(async () => undefined)
    const onCommitted = vi.fn(async () => undefined)

    const result = await savePodcastCoverChange(cancellableRequest, {
      ...options,
      isCancellable: true,
      prepare: buildPrepare({ addsContent: true, onCancelled, onCommitted }),
    })

    expect(result).toEqual({ status: 'cancelled' })
    expect(mocks.transaction.mock.lastCall?.[0]).toEqual([
      'read-previous',
      'mark-first-content',
      'cover-write',
      'update-podcast',
    ])
    expect(onCancelled).toHaveBeenCalledOnce()
    expect(onCommitted).not.toHaveBeenCalled()
    // The empty draft stays empty, and the editor's updatedAt holds again.
    expect(mocks.podcastUpdateMany).toHaveBeenLastCalledWith({
      data: { firstContentAt: null, updatedAt: previousSavedAt },
      where: { id: 'podcast-1', updatedAt: savedAt },
    })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
    expect(mocks.recordEditLog).not.toHaveBeenCalled()
  })
})
