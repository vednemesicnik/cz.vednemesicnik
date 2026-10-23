import { beforeEach, describe, expect, test, vi } from 'vitest'

import { issueSubmissionHandlers } from './submission-handlers.server'

// Pass-through permission wrapper with the signed-in author, and mocked Prisma.
const mocks = vi.hoisted(() => ({
  issueFindMany: vi.fn(),
  issueFindUnique: vi.fn(),
  issueFindUniqueOrThrow: vi.fn(),
  issueUpdate: vi.fn(),
  issueUpdateMany: vi.fn(),
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

vi.mock('~/utils/db.server', () => ({
  prisma: {
    issue: {
      findMany: mocks.issueFindMany,
      findUnique: mocks.issueFindUnique,
      findUniqueOrThrow: mocks.issueFindUniqueOrThrow,
      update: mocks.issueUpdate,
      updateMany: mocks.issueUpdateMany,
    },
  },
}))

const request = new Request('https://test.local/')
const target = { authorIds: ['contributor'], state: 'draft' as const }

// A complete draft (26e).
const draft = {
  author: { id: 'contributor', role: { level: 3 } },
  cover: { id: 'cover-1' },
  order: 4,
  pdf: { id: 'pdf-1' },
  state: 'draft',
  submittedAt: null,
  supplement: null,
  supplementSlug: '',
  year: 2026,
}

// Not while someone else than the actor edits it (log 0019).
const notHeldByOthers = (authorId: string) => ({
  AND: [{ OR: expect.arrayContaining([{ heldByAuthorId: authorId }]) }],
})

const heldByJakub = {
  heldByAuthor: { name: 'Jakub Novák' },
  heldByAuthorId: 'jakub',
  heldByTabId: 'tab-2',
  heldSince: new Date(Date.now() - 60_000),
  heldUntil: new Date(Date.now() + 60_000),
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.permissionContext.mockReturnValue({
    authorId: 'contributor',
    roleLevel: 3,
  })
  mocks.issueFindUniqueOrThrow.mockResolvedValue(draft)
  mocks.issueUpdateMany.mockResolvedValue({ count: 1 })
  // No other issue holds its number (log 0039).
  mocks.issueFindMany.mockResolvedValue([])
  // Nobody holds it, unless a test says so.
  mocks.issueFindUnique.mockResolvedValue(null)
})

describe('issueSubmissionHandlers.submit', () => {
  test('submits only while nobody else edits it, and ends one’s own edit (07d, 0019)', async () => {
    await issueSubmissionHandlers.submit(request, { id: 'i1', target })

    expect(mocks.issueUpdateMany).toHaveBeenCalledWith({
      data: {
        heldByAuthorId: null,
        heldByTabId: null,
        heldSince: null,
        heldUntil: null,
        submittedAt: expect.any(Date),
        submittedById: 'contributor',
      },
      where: {
        ...notHeldByOthers('contributor'),
        id: 'i1',
        state: 'draft',
        submittedAt: null,
      },
    })
  })

  test('submits nothing of an issue that lacks its files, and says what (26e)', async () => {
    mocks.issueFindUniqueOrThrow.mockResolvedValue({
      ...draft,
      cover: null,
      pdf: null,
    })

    const result = await issueSubmissionHandlers.submit(request, {
      id: 'i1',
      target,
    })

    expect(result).toEqual({ missing: ['Chybí obálka a\u00a0PDF.'] })
    expect(mocks.issueUpdateMany).not.toHaveBeenCalled()
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })

  test('submits nothing of an issue whose number another one holds (log 0039)', async () => {
    mocks.issueFindMany.mockResolvedValue([
      { id: 'i2', publishedNumber: '2026-4' },
    ])

    const result = await issueSubmissionHandlers.submit(request, {
      id: 'i1',
      target,
    })

    expect(result).toEqual({ missing: ['Číslo 4/2026 je obsazené.'] })
    expect(mocks.issueFindMany.mock.lastCall?.[0].where).toEqual({
      publishedNumber: { in: ['2026-4'] },
    })
    expect(mocks.issueUpdateMany).not.toHaveBeenCalled()
  })

  test('refuses an issue someone else edits, naming them (26i)', async () => {
    mocks.issueUpdateMany.mockResolvedValue({ count: 0 })
    mocks.issueFindUnique.mockResolvedValue(heldByJakub)

    await expect(
      issueSubmissionHandlers.submit(request, { id: 'i1', target }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Jakub Novák' },
      init: { status: 409 },
    })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })
})
