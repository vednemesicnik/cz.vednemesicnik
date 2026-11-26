import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { saveIssueFileChange } from './save-issue-file-change.server'

const mocks = vi.hoisted(() => ({
  issueFindUnique: vi.fn(),
  issueFindUniqueOrThrow: vi.fn(),
  issueUpdate: vi.fn(),
  issueUpdateMany: vi.fn(),
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
    issue: {
      findUnique: mocks.issueFindUnique,
      findUniqueOrThrow: mocks.issueFindUniqueOrThrow,
      update: mocks.issueUpdate,
      updateMany: mocks.issueUpdateMany,
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

const storedIssue = {
  authorId: 'author-1',
  cover: null,
  firstContentAt: new Date('2026-10-20T10:00:00Z'),
  ...ownHold,
  name: 'podzim',
  order: 4,
  pdf: null,
  state: 'draft',
  submittedAt: null,
  supplement: null,
  supplementSlug: '',
  year: 2026,
}

const savedAt = new Date('2026-10-20T12:00:00Z')
const previousSavedAt = new Date('2026-10-20T11:00:00Z')

type Prepare = Parameters<typeof saveIssueFileChange>[1]['prepare']

// The writes are tags standing in for Prisma operations.
const buildPrepare = (overrides: Record<string, unknown> = {}) =>
  vi.fn<Prepare>(
    async () =>
      ({
        logEvent: 'pdf_uploaded',
        writes: ['file-write'],
        ...overrides,
      }) as never,
  )

const options = { issueId: 'issue-1', tabId: 'tab-1' }

const notFoundError = () =>
  new Prisma.PrismaClientKnownRequestError('No record', {
    clientVersion: 'test',
    code: 'P2025',
  })

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
  mocks.issueFindUnique.mockResolvedValue(storedIssue)
  mocks.issueUpdate.mockReturnValue('update-issue')
  mocks.issueFindUniqueOrThrow.mockReturnValue('read-previous')
  mocks.issueUpdateMany.mockReturnValue('mark-first-content')
  mocks.transaction.mockImplementation(async (writes: unknown[]) =>
    writes.map((write) =>
      write === 'update-issue'
        ? { updatedAt: savedAt }
        : write === 'read-previous'
          ? { updatedAt: previousSavedAt }
          : write === 'mark-first-content'
            ? { count: 0 }
            : {},
    ),
  )
})

describe('saveIssueFileChange — the issue and the permission', () => {
  test('answers 404 for a missing issue', async () => {
    mocks.issueFindUnique.mockResolvedValue(null)
    const prepare = buildPrepare()

    await expect(
      saveIssueFileChange(request, { ...options, prepare }),
    ).rejects.toMatchObject({ init: { status: 404 } })

    expect(prepare).not.toHaveBeenCalled()
  })

  test('checks the stored author and state', async () => {
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      authorId: 'author-2',
      state: 'published',
    })

    await saveIssueFileChange(request, { ...options, prepare: buildPrepare() })

    expect(mocks.withAuthorPermission).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        action: 'update',
        entity: 'issue',
        target: { authorIds: ['author-2'], state: 'published' },
      }),
    )
  })

  test('answers 403 for a submitted issue locked for its author', async () => {
    mocks.permissionContext.mockReturnValue({
      authorId: 'author-1',
      roleLevel: 3,
    })
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      submittedAt: new Date(),
    })

    await expect(
      saveIssueFileChange(request, { ...options, prepare: buildPrepare() }),
    ).rejects.toMatchObject({ init: { status: 403 } })
  })
})

describe('saveIssueFileChange — the edit hold', () => {
  test('writes nothing when another author holds the issue', async () => {
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      heldByAuthor: { name: 'Ondřej Beneš' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-9',
    })
    const prepare = buildPrepare()

    const result = await saveIssueFileChange(request, {
      ...options,
      landsWithoutHold: true,
      prepare,
    })

    expect(result).toEqual({ heldByName: 'Ondřej Beneš', status: 'not-held' })
    expect(prepare).not.toHaveBeenCalled()
  })

  test('a released draft refuses a change that needs the hold', async () => {
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      heldByAuthor: null,
      heldByAuthorId: null,
      heldByTabId: null,
    })

    const result = await saveIssueFileChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(result).toEqual({ heldByName: null, status: 'not-held' })
  })

  test('an upload lands on a released draft, still a draft', async () => {
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      heldByAuthor: null,
      heldByAuthorId: null,
      heldByTabId: null,
    })

    const result = await saveIssueFileChange(request, {
      ...options,
      landsWithoutHold: true,
      prepare: buildPrepare(),
    })

    expect(result).toEqual({ status: 'saved', updatedAt: savedAt })
    expect(mocks.issueUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'issue-1',
          OR: [
            { heldByAuthorId: 'author-1', heldByTabId: 'tab-1' },
            { heldByTabId: null },
          ],
          state: 'draft',
        },
      }),
    )
  })
})

describe('saveIssueFileChange — the transaction', () => {
  test('commits the writes and the issue write, then onCommitted', async () => {
    const onCommitted = vi.fn(async () => undefined)

    const result = await saveIssueFileChange(request, {
      ...options,
      prepare: buildPrepare({ onCommitted }),
    })

    expect(result).toEqual({ status: 'saved', updatedAt: savedAt })
    expect(mocks.transaction).toHaveBeenCalledWith([
      'file-write',
      'update-issue',
    ])
    expect(onCommitted).toHaveBeenCalledOnce()
  })

  test('keeps the approvals of a submitted issue the Coordinator corrects (07d, 26e)', async () => {
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      submittedAt: new Date(),
    })

    const result = await saveIssueFileChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(result).toMatchObject({ status: 'saved' })
    expect(mocks.issueUpdate.mock.lastCall?.[0].data).not.toHaveProperty(
      'reviews',
    )
  })

  test('returns a failed preparation without a transaction', async () => {
    const result = await saveIssueFileChange(request, {
      ...options,
      prepare: vi.fn<Prepare>(async () => ({ status: 'failed' })),
    })

    expect(result).toEqual({ status: 'failed' })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('calls onRefused and answers not-held when the hold moved', async () => {
    mocks.transaction.mockRejectedValue(notFoundError())
    mocks.issueFindUnique
      .mockResolvedValueOnce(storedIssue)
      .mockResolvedValueOnce({
        ...storedIssue,
        heldByAuthor: { name: 'Ondřej Beneš' },
        heldByAuthorId: 'author-2',
        heldByTabId: 'tab-9',
      })
    const onRefused = vi.fn(async () => undefined)

    const result = await saveIssueFileChange(request, {
      ...options,
      prepare: buildPrepare({ onRefused }),
    })

    expect(result).toEqual({ heldByName: 'Ondřej Beneš', status: 'not-held' })
    expect(onRefused).toHaveBeenCalledOnce()
  })
})

describe('saveIssueFileChange — the history (26b)', () => {
  test('an upload into an issue with content logs only the upload', async () => {
    await saveIssueFileChange(request, { ...options, prepare: buildPrepare() })

    expect(mocks.recordEditLog).not.toHaveBeenCalled()
    expect(mocks.recordContentLog).toHaveBeenCalledWith(
      { entity: 'issue', entityId: 'issue-1', events: ['pdf_uploaded'] },
      expect.objectContaining({ authorId: 'author-1' }),
    )
    expect(mocks.publishContentEvent).toHaveBeenCalledWith(
      { change: 'update', entity: 'issue', entityId: 'issue-1' },
      expect.anything(),
    )
  })

  test('the first content is the creation, then the upload', async () => {
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      firstContentAt: null,
    })
    mocks.transaction.mockImplementation(async (writes: unknown[]) =>
      writes.map((write) =>
        write === 'mark-first-content' ? { count: 1 } : { updatedAt: savedAt },
      ),
    )

    await saveIssueFileChange(request, {
      ...options,
      prepare: buildPrepare({ addsContent: true, logEvent: 'cover_uploaded' }),
    })

    expect(mocks.transaction).toHaveBeenCalledWith([
      'mark-first-content',
      'file-write',
      'update-issue',
    ])
    expect(mocks.recordEditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ entity: 'issue', isCreation: true }),
    )
    expect(mocks.recordContentLog).toHaveBeenCalledWith(
      expect.objectContaining({ events: ['cover_uploaded'] }),
      expect.anything(),
    )
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('a removal logs nothing, but the lists hear of it', async () => {
    await saveIssueFileChange(request, {
      ...options,
      prepare: buildPrepare({ logEvent: undefined }),
    })

    expect(mocks.recordContentLog).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).toHaveBeenCalledOnce()
  })

  test('a removal of nothing tells nobody', async () => {
    await saveIssueFileChange(request, {
      ...options,
      prepare: buildPrepare({ logEvent: undefined, writes: [] }),
    })

    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })
})

describe('saveIssueFileChange — a cancellable change (bxy8xxqs)', () => {
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

    const result = await saveIssueFileChange(cancellableRequest, {
      ...options,
      isCancellable: true,
      prepare,
    })

    expect(result).toEqual({ status: 'cancelled' })
    expect(prepare).not.toHaveBeenCalled()
  })

  test('a cancel while the files are stored drops them and commits nothing', async () => {
    const { cancel, cancellableRequest } = buildCancellable()
    const onRefused = vi.fn(async () => undefined)
    const prepare = vi.fn<Prepare>(async () => {
      cancel()
      return { onRefused, writes: ['file-write'] } as never
    })

    const result = await saveIssueFileChange(cancellableRequest, {
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
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      firstContentAt: null,
    })
    mocks.transaction.mockImplementation(async (writes: unknown[]) => {
      cancel()
      return writes.map((write) =>
        write === 'mark-first-content'
          ? { count: 1 }
          : write === 'read-previous'
            ? { updatedAt: previousSavedAt }
            : { updatedAt: savedAt },
      )
    })
    const onCancelled = vi.fn(async () => undefined)
    const onCommitted = vi.fn(async () => undefined)

    const result = await saveIssueFileChange(cancellableRequest, {
      ...options,
      isCancellable: true,
      prepare: buildPrepare({ addsContent: true, onCancelled, onCommitted }),
    })

    expect(result).toEqual({ status: 'cancelled' })
    expect(onCancelled).toHaveBeenCalledOnce()
    expect(onCommitted).not.toHaveBeenCalled()
    // The empty draft stays empty, and the editor's updatedAt holds again.
    expect(mocks.issueUpdateMany).toHaveBeenLastCalledWith({
      data: { firstContentAt: null, updatedAt: previousSavedAt },
      where: { id: 'issue-1', updatedAt: savedAt },
    })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
    expect(mocks.recordEditLog).not.toHaveBeenCalled()
  })

  test('the draft is reset even when putting the files back fails', async () => {
    const { cancel, cancellableRequest } = buildCancellable()
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      firstContentAt: null,
    })
    mocks.transaction.mockImplementation(async (writes: unknown[]) => {
      cancel()
      return writes.map((write) =>
        write === 'mark-first-content'
          ? { count: 1 }
          : write === 'read-previous'
            ? { updatedAt: previousSavedAt }
            : { updatedAt: savedAt },
      )
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = await saveIssueFileChange(cancellableRequest, {
      ...options,
      isCancellable: true,
      prepare: buildPrepare({
        addsContent: true,
        onCancelled: async () => {
          throw new Error('store down')
        },
      }),
    })

    expect(result).toEqual({ status: 'cancelled' })
    expect(mocks.issueUpdateMany).toHaveBeenLastCalledWith({
      data: { firstContentAt: null, updatedAt: previousSavedAt },
      where: { id: 'issue-1', updatedAt: savedAt },
    })
    consoleError.mockRestore()
  })
})
