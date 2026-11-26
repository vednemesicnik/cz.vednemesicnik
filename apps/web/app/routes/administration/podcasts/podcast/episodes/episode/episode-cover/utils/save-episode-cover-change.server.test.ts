import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { saveEpisodeCoverChange } from './save-episode-cover-change.server'

const mocks = vi.hoisted(() => ({
  episodeFindUnique: vi.fn(),
  episodeFindUniqueOrThrow: vi.fn(),
  episodeUpdate: vi.fn(),
  episodeUpdateMany: vi.fn(),
  permissionContext: vi.fn(),
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
    podcastEpisode: {
      findUnique: mocks.episodeFindUnique,
      findUniqueOrThrow: mocks.episodeFindUniqueOrThrow,
      update: mocks.episodeUpdate,
      updateMany: mocks.episodeUpdateMany,
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

const storedEpisode = {
  authorId: 'author-1',
  cover: null,
  firstContentAt: new Date('2026-10-27T10:00:00Z'),
  ...ownHold,
  number: 14,
  podcastId: 'podcast-1',
  state: 'draft',
  submittedAt: null,
  title: 'Školník, který ví všechno',
}

const savedAt = new Date('2026-10-27T12:00:00Z')
const previousSavedAt = new Date('2026-10-27T11:00:00Z')

type Prepare = Parameters<typeof saveEpisodeCoverChange>[1]['prepare']

// The writes are tags standing in for Prisma operations.
const buildPrepare = (overrides: Record<string, unknown> = {}) =>
  vi.fn<Prepare>(
    async () =>
      ({ isUpload: true, writes: ['cover-write'], ...overrides }) as never,
  )

const options = {
  episodeId: 'episode-1',
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
      write === 'update-episode'
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
  mocks.episodeFindUnique.mockResolvedValue(storedEpisode)
  mocks.episodeUpdate.mockReturnValue('update-episode')
  mocks.episodeUpdateMany.mockReturnValue('mark-first-content')
  mocks.episodeFindUniqueOrThrow.mockReturnValue('read-previous')
  answerTransaction(0)
})

describe('saveEpisodeCoverChange — the episode and the permission', () => {
  test('answers deleted for a missing episode, before anything is stored', async () => {
    mocks.episodeFindUnique.mockResolvedValue(null)
    const prepare = buildPrepare()

    expect(
      await saveEpisodeCoverChange(request, { ...options, prepare }),
    ).toEqual({ status: 'deleted' })
    expect(prepare).not.toHaveBeenCalled()
  })

  test('answers deleted for an episode of another podcast', async () => {
    const prepare = buildPrepare()

    expect(
      await saveEpisodeCoverChange(request, {
        ...options,
        podcastId: 'podcast-2',
        prepare,
      }),
    ).toEqual({ status: 'deleted' })
    expect(prepare).not.toHaveBeenCalled()
  })

  test('checks the stored author and state', async () => {
    mocks.episodeFindUnique.mockResolvedValue({
      ...storedEpisode,
      authorId: 'author-2',
      state: 'published',
    })

    await saveEpisodeCoverChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(mocks.withAuthorPermission).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        action: 'update',
        entity: 'podcast_episode',
        target: { authorIds: ['author-2'], state: 'published' },
      }),
    )
  })

  test('answers 403 for a submitted episode locked for its author', async () => {
    mocks.permissionContext.mockReturnValue({
      authorId: 'author-1',
      roleLevel: 3,
    })
    mocks.episodeFindUnique.mockResolvedValue({
      ...storedEpisode,
      submittedAt: new Date(),
    })

    await expect(
      saveEpisodeCoverChange(request, { ...options, prepare: buildPrepare() }),
    ).rejects.toMatchObject({ init: { status: 403 } })
  })
})

describe('saveEpisodeCoverChange — the edit hold', () => {
  test('writes nothing when another author holds the episode', async () => {
    mocks.episodeFindUnique.mockResolvedValue({
      ...storedEpisode,
      heldByAuthor: { name: 'Ondřej Beneš' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-9',
    })
    const prepare = buildPrepare()

    const result = await saveEpisodeCoverChange(request, {
      ...options,
      landsWithoutHold: true,
      prepare,
    })

    expect(result).toEqual({ heldByName: 'Ondřej Beneš', status: 'not-held' })
    expect(prepare).not.toHaveBeenCalled()
  })

  test('a released draft refuses a change that needs the hold', async () => {
    mocks.episodeFindUnique.mockResolvedValue({
      ...storedEpisode,
      ...releasedHold,
    })
    const prepare = buildPrepare()

    expect(
      await saveEpisodeCoverChange(request, { ...options, prepare }),
    ).toEqual({ heldByName: null, status: 'not-held' })
    expect(prepare).not.toHaveBeenCalled()
  })

  test('an upload on its way still lands on a released draft', async () => {
    mocks.episodeFindUnique.mockResolvedValue({
      ...storedEpisode,
      ...releasedHold,
    })

    const result = await saveEpisodeCoverChange(request, {
      ...options,
      landsWithoutHold: true,
      prepare: buildPrepare(),
    })

    expect(result).toEqual({ status: 'saved', updatedAt: savedAt })
    expect(mocks.episodeUpdate.mock.lastCall?.[0].where).toEqual({
      id: 'episode-1',
      OR: [
        { heldByAuthorId: 'author-1', heldByTabId: 'tab-1' },
        { heldByTabId: null },
      ],
      state: 'draft',
    })
  })

  test('the write checks the hold again', async () => {
    await saveEpisodeCoverChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(mocks.episodeUpdate.mock.lastCall?.[0].where).toEqual({
      heldByAuthorId: 'author-1',
      heldByTabId: 'tab-1',
      id: 'episode-1',
      state: 'draft',
    })
  })

  test('drops the stored files and says who holds it when the hold moved before the write', async () => {
    mocks.transaction.mockRejectedValue(notFoundError())
    mocks.episodeFindUnique.mockResolvedValueOnce(storedEpisode)
    mocks.episodeFindUnique.mockResolvedValueOnce({
      ...storedEpisode,
      heldByAuthor: { name: 'Ondřej Beneš' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-9',
    })
    const onRefused = vi.fn(async () => {})

    const result = await saveEpisodeCoverChange(request, {
      ...options,
      prepare: buildPrepare({ onRefused }),
    })

    expect(result).toEqual({ heldByName: 'Ondřej Beneš', status: 'not-held' })
    expect(onRefused).toHaveBeenCalledOnce()
  })

  test('answers deleted when a new cover’s row failed on the episode gone meanwhile', async () => {
    mocks.transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Foreign key', {
        clientVersion: 'test',
        code: 'P2003',
      }),
    )
    mocks.episodeFindUnique.mockResolvedValueOnce(storedEpisode)
    mocks.episodeFindUnique.mockResolvedValueOnce(null)
    const onRefused = vi.fn(async () => {})

    expect(
      await saveEpisodeCoverChange(request, {
        ...options,
        prepare: buildPrepare({ onRefused }),
      }),
    ).toEqual({ status: 'deleted' })
    expect(onRefused).toHaveBeenCalledOnce()
  })

  test('rethrows another failure while the episode is there', async () => {
    const failure = new Error('disk full')
    mocks.transaction.mockRejectedValue(failure)

    await expect(
      saveEpisodeCoverChange(request, {
        ...options,
        prepare: buildPrepare(),
      }),
    ).rejects.toBe(failure)
  })

  test('answers deleted when the episode went before the write', async () => {
    mocks.transaction.mockRejectedValue(notFoundError())
    mocks.episodeFindUnique.mockResolvedValueOnce(storedEpisode)
    mocks.episodeFindUnique.mockResolvedValueOnce(null)

    expect(
      await saveEpisodeCoverChange(request, {
        ...options,
        prepare: buildPrepare(),
      }),
    ).toEqual({ status: 'deleted' })
  })
})

describe('saveEpisodeCoverChange — the save and the history', () => {
  test('a failure from prepare is the answer, and nothing is written', async () => {
    const result = await saveEpisodeCoverChange(request, {
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

    await saveEpisodeCoverChange(request, {
      ...options,
      prepare: buildPrepare({ onCommitted }),
    })

    expect(onCommitted).toHaveBeenCalledOnce()
    expect(mocks.recordEditLog).not.toHaveBeenCalled()
    expect(mocks.recordContentLog).toHaveBeenCalledWith(
      {
        entity: 'podcast_episode',
        entityId: 'episode-1',
        events: ['cover_uploaded'],
      },
      expect.anything(),
    )
    expect(mocks.publishContentEvent).toHaveBeenCalledWith(
      { change: 'update', entity: 'podcast_episode', entityId: 'episode-1' },
      expect.anything(),
    )
  })

  test('the first content of an empty draft is its creation', async () => {
    answerTransaction(1)

    await saveEpisodeCoverChange(request, {
      ...options,
      prepare: buildPrepare({ addsContent: true }),
    })

    expect(mocks.transaction.mock.lastCall?.[0]).toEqual([
      'mark-first-content',
      'cover-write',
      'update-episode',
    ])
    expect(mocks.recordEditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ entity: 'podcast_episode', isCreation: true }),
    )
    // The creation's log told the open lists.
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('a removal is one *Upraveno* per hold', async () => {
    await saveEpisodeCoverChange(request, {
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
    await saveEpisodeCoverChange(request, {
      ...options,
      prepare: buildPrepare({ isUpload: false, writes: [] }),
    })

    expect(mocks.recordEditLog).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })
})

describe('saveEpisodeCoverChange — a cancellable change (bxy8xxqs)', () => {
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

    const result = await saveEpisodeCoverChange(cancellableRequest, {
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

    const result = await saveEpisodeCoverChange(cancellableRequest, {
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

    const result = await saveEpisodeCoverChange(cancellableRequest, {
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
    mocks.episodeFindUnique.mockResolvedValue({
      ...storedEpisode,
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

    const result = await saveEpisodeCoverChange(cancellableRequest, {
      ...options,
      isCancellable: true,
      prepare: buildPrepare({ addsContent: true, onCancelled, onCommitted }),
    })

    expect(result).toEqual({ status: 'cancelled' })
    expect(mocks.transaction.mock.lastCall?.[0]).toEqual([
      'read-previous',
      'mark-first-content',
      'cover-write',
      'update-episode',
    ])
    expect(onCancelled).toHaveBeenCalledOnce()
    expect(onCommitted).not.toHaveBeenCalled()
    // The empty draft stays empty, and the editor's updatedAt holds again.
    expect(mocks.episodeUpdateMany).toHaveBeenLastCalledWith({
      data: { firstContentAt: null, updatedAt: previousSavedAt },
      where: { id: 'episode-1', updatedAt: savedAt },
    })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
    expect(mocks.recordEditLog).not.toHaveBeenCalled()
  })
})
