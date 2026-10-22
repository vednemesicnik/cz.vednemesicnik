import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { articleContentStateHandlers } from './content-state-handlers.server'

// Pass-through the permission wrapper and mock the two Prisma writes so this
// exercises the article config's applyState: the entity row clears reviews on a
// draft transition, but the mirrored PageSEO row must not (updateMany rejects
// nested relation writes).
const {
  withAuthorPermissionMock,
  articleDeleteMock,
  articleFindUniqueMock,
  articleFindUniqueOrThrowMock,
  articleUpdateMock,
  deleteRowWithImagesMock,
  pageSeoUpdateManyMock,
  recordContentLogMock,
  reviewFindFirstMock,
} = vi.hoisted(() => ({
  articleDeleteMock: vi.fn(),
  articleFindUniqueMock: vi.fn(),
  articleFindUniqueOrThrowMock: vi.fn(),
  articleUpdateMock: vi.fn(),
  deleteRowWithImagesMock: vi.fn(),
  pageSeoUpdateManyMock: vi.fn(),
  recordContentLogMock: vi.fn(),
  reviewFindFirstMock: vi.fn(),
  withAuthorPermissionMock: vi.fn(),
}))

// A delete runs inside a transaction that also removes the PageSEO row.
const transactionClient = {
  article: {
    delete: articleDeleteMock,
    findUniqueOrThrow: vi.fn().mockResolvedValue({ slug: null }),
  },
  pageSEO: { deleteMany: vi.fn() },
}

// The content log has its own tests; here it only must not reach Prisma.
vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: recordContentLogMock,
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

vi.mock('~/utils/db.server', () => ({
  prisma: {
    $transaction: (
      callback: (client: typeof transactionClient) => Promise<unknown>,
    ) => callback(transactionClient),
    article: {
      findUnique: articleFindUniqueMock,
      findUniqueOrThrow: articleFindUniqueOrThrowMock,
      update: articleUpdateMock,
    },
    pageSEO: { updateMany: pageSeoUpdateManyMock },
    review: { findFirst: reviewFindFirstMock },
  },
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteRowWithImages: deleteRowWithImagesMock,
}))

const request = new Request('https://test.local/')
const target = { authorIds: ['author-1'], state: 'published' as const }

// One row answers both reads of a publish: its completeness and its publish state.
const completeArticle = {
  _count: { authors: 1 },
  authors: [{ role: { level: 3 } }],
  content: 'Text',
  images: [],
  perex: 'Perex',
  publishedAt: null,
  reviews: [{ reviewer: { role: { level: 1 } } }],
  slug: 'clanek',
  title: 'Článek',
}

beforeEach(() => {
  vi.clearAllMocks()
  articleUpdateMock.mockResolvedValue({ slug: 'clear-redirect-test' })
  // Nobody holds it, unless a test says so.
  articleFindUniqueMock.mockResolvedValue(null)
  pageSeoUpdateManyMock.mockResolvedValue(undefined)
  // The publishing Coordinator's approval already exists.
  reviewFindFirstMock.mockResolvedValue({ id: 'review-1' })
  withAuthorPermissionMock.mockImplementation(
    (
      _request: Request,
      options: { execute: (context: unknown) => Promise<unknown> },
    ) => options.execute({ authorId: 'author-1', roleLevel: 1 }),
  )
})

describe('articleContentStateHandlers — retract review clearing', () => {
  test('clears reviews on the article row but not on the PageSEO row', async () => {
    await articleContentStateHandlers.retract(request, { id: 'a1', target })

    expect(articleUpdateMock).toHaveBeenCalledWith({
      data: {
        reviews: { deleteMany: {} },
        state: 'draft',
        submittedAt: null,
        submittedById: null,
      },
      select: { slug: true },
      // Not while someone else edits it (decision 0019).
      where: {
        AND: [{ OR: expect.arrayContaining([{ heldByAuthorId: 'author-1' }]) }],
        id: 'a1',
      },
    })

    const pageSeoData = pageSeoUpdateManyMock.mock.calls[0][0].data
    expect(pageSeoData).toEqual({ state: 'draft' })
    expect(pageSeoData).not.toHaveProperty('reviews')
  })
})

describe('articleContentStateHandlers — submission', () => {
  test('publishing ends the submission on the article row only', async () => {
    articleFindUniqueOrThrowMock.mockResolvedValue(completeArticle)

    await articleContentStateHandlers.publish(request, {
      id: 'a1',
      target: { authorIds: ['author-2'], state: 'draft' },
    })

    const articleData = articleUpdateMock.mock.lastCall?.[0].data
    expect(articleData).toMatchObject({
      state: 'published',
      submittedAt: null,
      submittedById: null,
    })
    expect(pageSeoUpdateManyMock.mock.lastCall?.[0].data).not.toHaveProperty(
      'submittedAt',
    )
  })

  test('an incomplete article is not published (23h)', async () => {
    articleFindUniqueOrThrowMock.mockResolvedValue({
      ...completeArticle,
      perex: null,
    })
    articleUpdateMock.mockClear()

    const result = await articleContentStateHandlers.publish(request, {
      id: 'a1',
      target: { authorIds: ['author-2'], state: 'draft' },
    })

    expect(result).toEqual({ missing: ['Chybí perex.'] })
    expect(articleUpdateMock).not.toHaveBeenCalled()
  })

  test('changing the publish date keeps the row as it is', async () => {
    await articleContentStateHandlers.changePublishedAt(request, {
      id: 'a1',
      publishedAt: new Date('2026-01-01T10:00:00Z'),
      target,
    })

    expect(articleUpdateMock.mock.lastCall?.[0].data).not.toHaveProperty(
      'submittedAt',
    )
  })

  test('a submitted draft is not deleted', async () => {
    articleFindUniqueOrThrowMock.mockResolvedValue({
      submittedAt: new Date('2026-09-25T10:00:00Z'),
    })

    await expect(
      articleContentStateHandlers.delete(request, {
        id: 'a1',
        target: { authorIds: ['author-1'], state: 'draft' },
      }),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(deleteRowWithImagesMock).not.toHaveBeenCalled()
  })

  test('an unsubmitted draft is deleted', async () => {
    articleFindUniqueOrThrowMock.mockResolvedValue({ submittedAt: null })

    await articleContentStateHandlers.delete(request, {
      id: 'a1',
      target: { authorIds: ['author-1'], state: 'draft' },
    })

    expect(deleteRowWithImagesMock).toHaveBeenCalledOnce()
  })
})

describe('articleContentStateHandlers — the edit hold (07g, decision 0019)', () => {
  test('publishing ends one’s own hold with the draft', async () => {
    articleFindUniqueOrThrowMock.mockResolvedValue(completeArticle)

    await articleContentStateHandlers.publish(request, {
      id: 'a1',
      target: { authorIds: ['author-2'], state: 'draft' },
    })

    expect(articleUpdateMock.mock.lastCall?.[0].data).toMatchObject({
      heldByAuthorId: null,
      heldByTabId: null,
      heldSince: null,
      heldUntil: null,
    })
  })

  test('a transition on an article someone else edits is refused in its write', async () => {
    articleUpdateMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No record', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    articleFindUniqueMock.mockResolvedValue({
      heldByAuthor: { name: 'Jakub Novák' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-2',
      heldSince: new Date(Date.now() - 60_000),
      heldUntil: new Date(Date.now() + 60_000),
    })

    await expect(
      articleContentStateHandlers.retract(request, { id: 'a1', target }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Jakub Novák' },
      init: { status: 409 },
    })
    expect(pageSeoUpdateManyMock).not.toHaveBeenCalled()
    expect(recordContentLogMock).not.toHaveBeenCalled()
  })

  test('a hold that ended before the read-back: the write runs once more', async () => {
    articleUpdateMock.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('No record', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    // The hold expired meanwhile: nobody holds it.
    articleFindUniqueMock.mockResolvedValue({
      heldByAuthor: { name: 'Jakub Novák' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-2',
      heldSince: new Date(Date.now() - 180_000),
      heldUntil: new Date(Date.now() - 60_000),
    })

    await articleContentStateHandlers.retract(request, { id: 'a1', target })

    expect(articleUpdateMock).toHaveBeenCalledTimes(2)
    expect(recordContentLogMock).toHaveBeenCalledOnce()
  })

  test('approving again while someone else edits is refused too', async () => {
    articleFindUniqueOrThrowMock.mockResolvedValue({ submittedAt: new Date() })
    articleFindUniqueMock.mockResolvedValue({
      heldByAuthor: { name: 'Jakub Novák' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-2',
      heldSince: new Date(Date.now() - 60_000),
      heldUntil: new Date(Date.now() + 60_000),
    })

    await expect(
      articleContentStateHandlers.review(request, {
        id: 'a1',
        target: { authorIds: ['author-2'], state: 'draft' },
      }),
    ).rejects.toMatchObject({ data: { heldByName: 'Jakub Novák' } })
    expect(recordContentLogMock).not.toHaveBeenCalled()
  })
})

describe('articleContentStateHandlers — a delete waits for every editor (0036)', () => {
  const draftTarget = { authorIds: ['author-1'], state: 'draft' as const }

  beforeEach(() => {
    articleFindUniqueOrThrowMock.mockResolvedValue({ submittedAt: null })
    // Runs the row write the image clean-up wraps.
    deleteRowWithImagesMock.mockImplementation(
      (_findImageIds: unknown, deleteRow: () => Promise<unknown>) =>
        deleteRow(),
    )
  })

  test('the delete repeats “the hold is free”, one’s own hold included', async () => {
    articleDeleteMock.mockResolvedValue({ id: 'a1' })

    await articleContentStateHandlers.delete(request, {
      id: 'a1',
      target: draftTarget,
    })

    expect(articleDeleteMock).toHaveBeenCalledWith({
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
        id: 'a1',
      },
    })
  })

  test('one’s own editor in another tab refuses it, saying so', async () => {
    articleDeleteMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No record', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    articleFindUniqueMock.mockResolvedValue({
      heldByAuthor: { name: 'Jakub Novák' },
      heldByAuthorId: 'author-1',
      heldByTabId: 'tab-1',
      heldSince: new Date(Date.now() - 60_000),
      heldUntil: new Date(Date.now() + 60_000),
    })

    await expect(
      articleContentStateHandlers.delete(request, {
        id: 'a1',
        target: draftTarget,
      }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Jakub Novák', isOwnOtherTab: true },
      init: { status: 409 },
    })
  })

  test('someone else’s editor refuses it as before', async () => {
    articleDeleteMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No record', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    articleFindUniqueMock.mockResolvedValue({
      heldByAuthor: { name: 'Marie Horáková' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-2',
      heldSince: new Date(Date.now() - 60_000),
      heldUntil: new Date(Date.now() + 60_000),
    })

    await expect(
      articleContentStateHandlers.delete(request, {
        id: 'a1',
        target: draftTarget,
      }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Marie Horáková', isOwnOtherTab: false },
    })
  })
})
