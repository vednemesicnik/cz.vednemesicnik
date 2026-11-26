import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { issueContentStateHandlers } from './content-state-handlers.server'

// Pass-through permission wrapper and mocked Prisma, so this exercises the
// issue config's writes and their hold condition (log 0019).
const mocks = vi.hoisted(() => ({
  issueDelete: vi.fn(),
  issueFindMany: vi.fn(),
  issueFindUnique: vi.fn(),
  issueFindUniqueOrThrow: vi.fn(),
  issuePdfUpdate: vi.fn(),
  issueUpdate: vi.fn(),
  recordContentLog: vi.fn(),
  reviewFindFirst: vi.fn(),
}))

vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: mocks.recordContentLog,
}))

vi.mock('~/utils/content-log/delete-content-log.server', () => ({
  deleteContentLog: vi.fn(),
}))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({
    withAuthorPermission: (
      _request: Request,
      options: { execute: (context: unknown) => Promise<unknown> },
    ) => options.execute({ authorId: 'author-1', roleLevel: 1 }),
  }),
)

// No store here: the row write is what is under test.
vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteRowWithImages: (
    _findImageIds: unknown,
    deleteRow: () => Promise<unknown>,
  ) => deleteRow(),
}))

vi.mock('~/utils/pdf-store/store-pdf.server', () => ({
  deletePdfObject: vi.fn(),
}))

// The publish transaction (log 0039) runs on the same mocks.
vi.mock('~/utils/db.server', () => {
  const issue = {
    delete: mocks.issueDelete,
    findMany: mocks.issueFindMany,
    findUnique: mocks.issueFindUnique,
    findUniqueOrThrow: mocks.issueFindUniqueOrThrow,
    update: mocks.issueUpdate,
  }
  const issuePDF = { update: mocks.issuePdfUpdate }
  return {
    prisma: {
      $transaction: (
        callback: (client: { issue: typeof issue }) => Promise<unknown>,
      ) => callback({ issue, issuePDF } as never),
      issue,
      issuePDF,
      review: { findFirst: mocks.reviewFindFirst },
    },
  }
})

const request = new Request('https://test.local/')
const draftTarget = { authorIds: ['author-2'], state: 'draft' as const }
const publishedTarget = { authorIds: ['author-2'], state: 'published' as const }

// What a publish reads: the Coordinator's own approval is not needed, the
// issue is complete (26e), and its PDF has no name before publish (log 0039).
const publishState = {
  author: { role: { level: 3 } },
  cover: { id: 'cover-1' },
  order: 4,
  pdf: { fileName: null },
  publishedAt: null,
  publishedNumber: null,
  reviews: [],
  submittedAt: null,
  supplement: null,
  supplementSlug: '',
  year: 2026,
}

const uniqueConstraintError = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    clientVersion: 'test',
    code: 'P2002',
  })

// Not while someone else than the actor edits it (log 0019).
const notHeldByOthers = {
  AND: [{ OR: expect.arrayContaining([{ heldByAuthorId: 'author-1' }]) }],
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.issueUpdate.mockResolvedValue({ id: 'i1' })
  mocks.issueFindUniqueOrThrow.mockResolvedValue(publishState)
  // No other issue holds its number.
  mocks.issueFindMany.mockResolvedValue([])
  mocks.reviewFindFirst.mockResolvedValue({ id: 'review-1' })
  // Nobody holds it, unless a test says so.
  mocks.issueFindUnique.mockResolvedValue(null)
})

describe('issueContentStateHandlers — what a publish needs (26e)', () => {
  test('publishes nothing of an issue without its PDF and says so', async () => {
    mocks.issueFindUniqueOrThrow.mockResolvedValue({
      ...publishState,
      pdf: null,
    })

    const result = await issueContentStateHandlers.publish(request, {
      id: 'i1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: ['Chybí PDF.'] })
    expect(mocks.issueUpdate).not.toHaveBeenCalled()
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })

  test('publishes nothing of an issue whose number another one holds', async () => {
    mocks.issueFindMany.mockResolvedValue([
      { id: 'i2', publishedNumber: '2026-4' },
    ])

    const result = await issueContentStateHandlers.publish(request, {
      id: 'i1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: ['Číslo 4/2026 je obsazené.'] })
    expect(mocks.issueUpdate).not.toHaveBeenCalled()
  })

  test('approves nothing of an incomplete issue (26e)', async () => {
    mocks.issueFindUniqueOrThrow.mockResolvedValue({
      ...publishState,
      cover: null,
      submittedAt: new Date(),
    })

    const result = await issueContentStateHandlers.review(request, {
      id: 'i1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: ['Chybí obálka.'] })
    expect(mocks.reviewFindFirst).not.toHaveBeenCalled()
  })
})

describe('issueContentStateHandlers — publish holds the number (log 0039)', () => {
  test('writes the number it holds and names the PDF by it', async () => {
    const result = await issueContentStateHandlers.publish(request, {
      id: 'i1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: [] })
    expect(mocks.issueUpdate.mock.lastCall?.[0].data).toMatchObject({
      publishedNumber: '2026-4',
      state: 'published',
    })
    expect(mocks.issuePdfUpdate).toHaveBeenCalledWith({
      data: { fileName: 'VDM-2026-4.pdf' },
      select: { id: true },
      where: { issueId: 'i1' },
    })
  })

  test("names a supplement's PDF with its slug", async () => {
    mocks.issueFindUniqueOrThrow.mockResolvedValue({
      ...publishState,
      order: 2,
      supplement: 'Maturitní ples',
      supplementSlug: 'maturitni-ples',
    })

    await issueContentStateHandlers.publish(request, {
      id: 'i1',
      target: draftTarget,
    })

    expect(mocks.issueUpdate.mock.lastCall?.[0].data).toMatchObject({
      publishedNumber: '2026-2-maturitni-ples',
    })
    expect(mocks.issuePdfUpdate.mock.lastCall?.[0].data).toEqual({
      fileName: 'VDM-2026-2-maturitni-ples.pdf',
    })
  })

  test('keeps the PDF name of the number it already holds (log 0030)', async () => {
    mocks.issueFindUniqueOrThrow.mockResolvedValue({
      ...publishState,
      pdf: { fileName: 'VDM_2026_4.pdf' },
      publishedNumber: '2026-4',
    })

    await issueContentStateHandlers.publish(request, {
      id: 'i1',
      target: draftTarget,
    })

    expect(mocks.issueUpdate).toHaveBeenCalled()
    expect(mocks.issuePdfUpdate).not.toHaveBeenCalled()
  })

  test('renames the PDF when it comes back with another number', async () => {
    mocks.issueFindUniqueOrThrow.mockResolvedValue({
      ...publishState,
      pdf: { fileName: 'VDM-2026-3.pdf' },
      publishedNumber: '2026-3',
    })

    await issueContentStateHandlers.publish(request, {
      id: 'i1',
      target: draftTarget,
    })

    expect(mocks.issuePdfUpdate.mock.lastCall?.[0].data).toEqual({
      fileName: 'VDM-2026-4.pdf',
    })
  })

  test('a number another issue took meanwhile blocks it as missing content', async () => {
    mocks.issueUpdate.mockRejectedValue(uniqueConstraintError())

    const result = await issueContentStateHandlers.publish(request, {
      id: 'i1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: ['Číslo 4/2026 je obsazené.'] })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })

  test('so does the PDF name it gives', async () => {
    mocks.issuePdfUpdate.mockRejectedValue(uniqueConstraintError())

    const result = await issueContentStateHandlers.publish(request, {
      id: 'i1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: ['Číslo 4/2026 je obsazené.'] })
  })
})

describe('issueContentStateHandlers — the edit hold', () => {
  test('publishing writes only while nobody else edits it, and ends one’s own hold', async () => {
    await issueContentStateHandlers.publish(request, {
      id: 'i1',
      target: draftTarget,
    })

    const write = mocks.issueUpdate.mock.lastCall?.[0]
    expect(write.where).toEqual({ ...notHeldByOthers, id: 'i1' })
    expect(write.data).toMatchObject({
      heldByAuthorId: null,
      heldByTabId: null,
      heldSince: null,
      heldUntil: null,
      state: 'published',
    })
  })

  test('retracting keeps the hold columns as they are', async () => {
    await issueContentStateHandlers.retract(request, {
      id: 'i1',
      target: publishedTarget,
    })

    expect(mocks.issueUpdate.mock.lastCall?.[0].data).not.toHaveProperty(
      'heldByAuthorId',
    )
  })

  test('a transition on an issue someone else edits is refused, naming them (26i)', async () => {
    mocks.issueUpdate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No record', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    mocks.issueFindUnique.mockResolvedValue({
      heldByAuthor: { name: 'Jakub Novák' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-2',
      heldSince: new Date(Date.now() - 60_000),
      heldUntil: new Date(Date.now() + 60_000),
    })

    await expect(
      issueContentStateHandlers.retract(request, {
        id: 'i1',
        target: publishedTarget,
      }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Jakub Novák' },
      init: { status: 409 },
    })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })
})

describe('issueContentStateHandlers — a delete waits for every editor (0036)', () => {
  beforeEach(() => {
    mocks.issueFindUniqueOrThrow.mockResolvedValue({
      ...publishState,
      submittedAt: null,
    })
  })

  test('the delete repeats “the hold is free”, one’s own hold included', async () => {
    mocks.issueDelete.mockResolvedValue({ id: 'i1' })

    await issueContentStateHandlers.delete(request, {
      id: 'i1',
      target: draftTarget,
    })

    expect(mocks.issueDelete).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            OR: [
              { heldByAuthorId: null },
              { heldUntil: null },
              { heldUntil: { lte: expect.any(Date) } },
            ],
          },
        ],
        id: 'i1',
      },
    })
  })

  test('one’s own editor in another tab refuses it, saying so', async () => {
    mocks.issueDelete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No record', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    mocks.issueFindUnique.mockResolvedValue({
      heldByAuthor: { name: 'Jakub Novák' },
      heldByAuthorId: 'author-1',
      heldByTabId: 'tab-1',
      heldSince: new Date(Date.now() - 60_000),
      heldUntil: new Date(Date.now() + 60_000),
    })

    await expect(
      issueContentStateHandlers.delete(request, {
        id: 'i1',
        target: draftTarget,
      }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Jakub Novák', isOwnOtherTab: true },
      init: { status: 409 },
    })
  })
})
