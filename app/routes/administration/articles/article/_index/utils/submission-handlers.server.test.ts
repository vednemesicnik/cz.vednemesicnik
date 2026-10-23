import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { articleSubmissionHandlers } from './submission-handlers.server'

// Pass-through permission wrapper (the role grant is tested elsewhere) with a
// switchable signed-in author, and mocked Prisma writes.
const mocks = vi.hoisted(() => ({
  articleFindUnique: vi.fn(),
  articleFindUniqueOrThrow: vi.fn(),
  articleUpdate: vi.fn(),
  articleUpdateMany: vi.fn(),
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
    article: {
      findUnique: mocks.articleFindUnique,
      findUniqueOrThrow: mocks.articleFindUniqueOrThrow,
      update: mocks.articleUpdate,
      updateMany: mocks.articleUpdateMany,
    },
  },
}))

const request = new Request('https://test.local/')
const target = { authorIds: ['contributor'], state: 'draft' as const }
const submittedAt = new Date('2026-09-25T10:00:00Z')

const contributor = { id: 'contributor', role: { level: 3 } }
const coordinator = { id: 'coordinator', role: { level: 1 } }

const completeDraft = {
  authors: [contributor],
  content: '<p>Text</p>',
  images: [],
  perex: 'Perex',
  slug: 'clanek',
  state: 'draft',
  submittedAt: null,
  title: 'Článek',
}

const signInAs = (authorId: string, roleLevel: number) =>
  mocks.permissionContext.mockReturnValue({ authorId, roleLevel })

// Not while someone else than the actor edits it (log 0019).
const notHeldByOthers = (authorId: string) => ({
  AND: [{ OR: expect.arrayContaining([{ heldByAuthorId: authorId }]) }],
})

const clearedSubmission = (authorId: string) => ({
  data: {
    reviews: { deleteMany: {} },
    submittedAt: null,
    submittedById: null,
  },
  select: { id: true },
  where: { ...notHeldByOthers(authorId), id: 'a1' },
})

const heldByJakub = {
  heldByAuthor: { name: 'Jakub Novák' },
  heldByAuthorId: 'jakub',
  heldByTabId: 'tab-2',
  heldSince: new Date(Date.now() - 60_000),
  heldUntil: new Date(Date.now() + 60_000),
}

const recordNotFound = () =>
  new Prisma.PrismaClientKnownRequestError('No record', {
    clientVersion: 'test',
    code: 'P2025',
  })

beforeEach(() => {
  vi.clearAllMocks()
  signInAs('contributor', 3)
  mocks.articleUpdateMany.mockResolvedValue({ count: 1 })
  mocks.articleUpdate.mockResolvedValue({ id: 'a1' })
  // Nobody holds it, unless a test says so.
  mocks.articleFindUnique.mockResolvedValue(null)
})

describe('articleSubmissionHandlers.submit', () => {
  test('records when and who submitted a complete draft', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue(completeDraft)

    await expect(
      articleSubmissionHandlers.submit(request, { id: 'a1', target }),
    ).resolves.toEqual({ missing: [] })

    expect(mocks.articleUpdateMany).toHaveBeenCalledWith({
      // One's own edit, open in another tab, ends with the submission.
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
        id: 'a1',
        state: 'draft',
        submittedAt: null,
      },
    })
  })

  test('refuses an article someone else edits, naming them (07g)', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue(completeDraft)
    mocks.articleUpdateMany.mockResolvedValue({ count: 0 })
    mocks.articleFindUnique.mockResolvedValue(heldByJakub)

    await expect(
      articleSubmissionHandlers.submit(request, { id: 'a1', target }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Jakub Novák' },
      init: { status: 409 },
    })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })

  test('lists what is missing and submits nothing', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue({
      ...completeDraft,
      perex: null,
    })

    await expect(
      articleSubmissionHandlers.submit(request, { id: 'a1', target }),
    ).resolves.toEqual({ missing: ['Chybí perex.'] })
    expect(mocks.articleUpdateMany).not.toHaveBeenCalled()
  })

  test('refuses someone who is not an author', async () => {
    signInAs('coordinator', 1)
    mocks.articleFindUniqueOrThrow.mockResolvedValue(completeDraft)

    await expect(
      articleSubmissionHandlers.submit(request, { id: 'a1', target }),
    ).rejects.toMatchObject({ init: { status: 403 } })
  })

  test('refuses an already submitted draft', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue({
      ...completeDraft,
      submittedAt,
    })

    await expect(
      articleSubmissionHandlers.submit(request, { id: 'a1', target }),
    ).rejects.toMatchObject({ init: { status: 403 } })
  })

  test('refuses an article with a Coordinator among its authors', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue({
      ...completeDraft,
      authors: [contributor, coordinator],
    })

    await expect(
      articleSubmissionHandlers.submit(request, { id: 'a1', target }),
    ).rejects.toMatchObject({ init: { status: 403 } })
  })

  test('answers a conflict when the draft changed meanwhile', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue(completeDraft)
    mocks.articleUpdateMany.mockResolvedValue({ count: 0 })

    await expect(
      articleSubmissionHandlers.submit(request, { id: 'a1', target }),
    ).rejects.toMatchObject({ init: { status: 409 } })
  })
})

describe('articleSubmissionHandlers.withdraw', () => {
  test('an author takes it back: submission and approval are cleared', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue({
      ...completeDraft,
      submittedAt,
    })

    await articleSubmissionHandlers.withdraw(request, { id: 'a1', target })

    expect(mocks.articleUpdate).toHaveBeenCalledWith(
      clearedSubmission('contributor'),
    )
  })

  test('waits while the Coordinator corrects it (07g)', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue({
      ...completeDraft,
      submittedAt,
    })
    mocks.articleUpdate.mockRejectedValue(recordNotFound())
    mocks.articleFindUnique.mockResolvedValue(heldByJakub)

    await expect(
      articleSubmissionHandlers.withdraw(request, { id: 'a1', target }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Jakub Novák' },
      init: { status: 409 },
    })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('refuses someone who is not an author', async () => {
    signInAs('coordinator', 1)
    mocks.articleFindUniqueOrThrow.mockResolvedValue({
      ...completeDraft,
      submittedAt,
    })

    await expect(
      articleSubmissionHandlers.withdraw(request, { id: 'a1', target }),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(mocks.articleUpdate).not.toHaveBeenCalled()
  })
})

describe('articleSubmissionHandlers.returnForEdits', () => {
  test('the Coordinator returns it: submission and approval are cleared', async () => {
    signInAs('coordinator', 1)
    mocks.articleFindUniqueOrThrow.mockResolvedValue({
      ...completeDraft,
      submittedAt,
    })

    await articleSubmissionHandlers.returnForEdits(request, {
      id: 'a1',
      target,
    })

    expect(mocks.articleUpdate).toHaveBeenCalledWith(
      clearedSubmission('coordinator'),
    )
  })

  test('refuses a role below the approver', async () => {
    signInAs('creator', 2)
    mocks.articleFindUniqueOrThrow.mockResolvedValue({
      ...completeDraft,
      submittedAt,
    })

    await expect(
      articleSubmissionHandlers.returnForEdits(request, { id: 'a1', target }),
    ).rejects.toMatchObject({ init: { status: 403 } })
  })

  test('refuses an unsubmitted draft', async () => {
    signInAs('coordinator', 1)
    mocks.articleFindUniqueOrThrow.mockResolvedValue(completeDraft)

    await expect(
      articleSubmissionHandlers.returnForEdits(request, { id: 'a1', target }),
    ).rejects.toMatchObject({ init: { status: 403 } })
  })
})

describe('articleSubmissionHandlers — content events', () => {
  const submissionEvent = {
    change: 'submission',
    entity: 'article',
    entityId: 'a1',
  }

  test('a submit announces the change', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue(completeDraft)

    await articleSubmissionHandlers.submit(request, { id: 'a1', target })

    expect(mocks.publishContentEvent).toHaveBeenCalledWith(
      submissionEvent,
      mocks.permissionContext(),
    )
    expect(mocks.recordContentLog).toHaveBeenCalledExactlyOnceWith(
      { entity: 'article', entityId: 'a1', events: ['submit'] },
      mocks.permissionContext(),
    )
  })

  test('a submit blocked by missing content announces nothing', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue({
      ...completeDraft,
      perex: '',
    })

    await articleSubmissionHandlers.submit(request, { id: 'a1', target })

    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('a withdraw and a return announce the change', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue({
      ...completeDraft,
      submittedAt,
    })
    await articleSubmissionHandlers.withdraw(request, { id: 'a1', target })

    signInAs('coordinator', 1)
    await articleSubmissionHandlers.returnForEdits(request, {
      id: 'a1',
      target,
    })

    expect(mocks.publishContentEvent).toHaveBeenCalledTimes(2)
    expect(
      mocks.recordContentLog.mock.calls.map(([record]) => record.events),
    ).toEqual([['withdraw'], ['return']])
    expect(mocks.publishContentEvent).toHaveBeenLastCalledWith(
      submissionEvent,
      mocks.permissionContext(),
    )
  })

  test('a refused transition announces nothing', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue(completeDraft)
    signInAs('someone-else', 3)

    await expect(
      articleSubmissionHandlers.submit(request, { id: 'a1', target }),
    ).rejects.toBeDefined()

    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })
})
