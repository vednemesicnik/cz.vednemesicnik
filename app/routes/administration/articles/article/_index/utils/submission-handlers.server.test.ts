import { beforeEach, describe, expect, test, vi } from 'vitest'

import { articleSubmissionHandlers } from './submission-handlers.server'

// Pass-through permission wrapper (the role grant is tested elsewhere) with a
// switchable signed-in author, and mocked Prisma writes.
const mocks = vi.hoisted(() => ({
  articleFindUniqueOrThrow: vi.fn(),
  articleUpdate: vi.fn(),
  articleUpdateMany: vi.fn(),
  permissionContext: vi.fn(),
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
  excerpt: 'Perex',
  images: [],
  slug: 'clanek',
  state: 'draft',
  submittedAt: null,
  title: 'Článek',
}

const signInAs = (authorId: string, roleLevel: number) =>
  mocks.permissionContext.mockReturnValue({ authorId, roleLevel })

const clearedSubmission = {
  data: {
    reviews: { deleteMany: {} },
    submittedAt: null,
    submittedById: null,
  },
  where: { id: 'a1' },
}

beforeEach(() => {
  vi.clearAllMocks()
  signInAs('contributor', 3)
  mocks.articleUpdateMany.mockResolvedValue({ count: 1 })
})

describe('articleSubmissionHandlers.submit', () => {
  test('records when and who submitted a complete draft', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue(completeDraft)

    await expect(
      articleSubmissionHandlers.submit(request, { id: 'a1', target }),
    ).resolves.toEqual({ missing: [] })

    expect(mocks.articleUpdateMany).toHaveBeenCalledWith({
      data: { submittedAt: expect.any(Date), submittedById: 'contributor' },
      where: { id: 'a1', state: 'draft', submittedAt: null },
    })
  })

  test('lists what is missing and submits nothing', async () => {
    mocks.articleFindUniqueOrThrow.mockResolvedValue({
      ...completeDraft,
      excerpt: null,
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

    expect(mocks.articleUpdate).toHaveBeenCalledWith(clearedSubmission)
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

    expect(mocks.articleUpdate).toHaveBeenCalledWith(clearedSubmission)
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
