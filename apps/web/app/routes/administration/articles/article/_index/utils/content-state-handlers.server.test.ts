import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { articleContentStateHandlers } from './content-state-handlers.server'

// Pass-through the permission wrapper and mock the Prisma writes so this
// exercises the article config's applyState.
const {
  withAuthorPermissionMock,
  articleDeleteMock,
  articleFindManyMock,
  articleFindUniqueMock,
  articleFindUniqueOrThrowMock,
  articleUpdateMock,
  deleteRowWithImagesMock,
  ensureArticleOgImageMock,
  recordContentLogMock,
  reviewFindFirstMock,
  transactionFindUniqueOrThrowMock,
} = vi.hoisted(() => ({
  articleDeleteMock: vi.fn(),
  articleFindManyMock: vi.fn(),
  articleFindUniqueMock: vi.fn(),
  articleFindUniqueOrThrowMock: vi.fn(),
  articleUpdateMock: vi.fn(),
  deleteRowWithImagesMock: vi.fn(),
  ensureArticleOgImageMock: vi.fn(),
  recordContentLogMock: vi.fn(),
  reviewFindFirstMock: vi.fn(),
  transactionFindUniqueOrThrowMock: vi.fn(),
  withAuthorPermissionMock: vi.fn(),
}))

// A publish runs in a transaction that reads the typed address and writes it
// as the one the article holds.
const transactionClient = {
  article: {
    findUniqueOrThrow: transactionFindUniqueOrThrowMock,
    update: articleUpdateMock,
  },
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
      delete: articleDeleteMock,
      findMany: articleFindManyMock,
      findUnique: articleFindUniqueMock,
      findUniqueOrThrow: articleFindUniqueOrThrowMock,
      update: articleUpdateMock,
    },
    review: { findFirst: reviewFindFirstMock },
  },
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteRowWithImages: deleteRowWithImagesMock,
}))

vi.mock(
  '~/routes/administration/articles/utils/ensure-article-og-image.server',
  () => ({ ensureArticleOgImage: ensureArticleOgImageMock }),
)

const request = new Request('https://test.local/')
const target = { authorIds: ['author-1'], state: 'published' as const }

// One row answers both reads of a publish: its completeness and its publish state.
const completeArticle = {
  _count: { authors: 1 },
  authors: [{ role: { level: 3 } }],
  content: 'Text',
  featuredImageId: null,
  images: [],
  perex: 'Perex',
  publishedAt: null,
  reviews: [{ reviewer: { role: { level: 1 } } }],
  slug: 'clanek',
  title: 'Článek',
}

beforeEach(() => {
  vi.clearAllMocks()
  articleUpdateMock.mockResolvedValue({ id: 'a1' })
  // No other article holds the address as published (log 0039).
  articleFindManyMock.mockResolvedValue([])
  transactionFindUniqueOrThrowMock.mockResolvedValue({ slug: 'clanek' })
  // Nobody holds it, unless a test says so.
  articleFindUniqueMock.mockResolvedValue(null)
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
  test('clears the reviews', async () => {
    await articleContentStateHandlers.retract(request, { id: 'a1', target })

    expect(articleUpdateMock).toHaveBeenCalledWith({
      data: {
        reviews: { deleteMany: {} },
        state: 'draft',
        submittedAt: null,
        submittedById: null,
      },
      select: { id: true },
      // Not while someone else edits it (log 0019).
      where: {
        AND: [{ OR: expect.arrayContaining([{ heldByAuthorId: 'author-1' }]) }],
        id: 'a1',
      },
    })
  })
})

describe('articleContentStateHandlers — submission', () => {
  test('publishing ends the submission', async () => {
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

describe('articleContentStateHandlers — the edit hold (07g, log 0019)', () => {
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
    articleFindUniqueOrThrowMock.mockResolvedValue({
      ...completeArticle,
      submittedAt: new Date(),
    })
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

describe('articleContentStateHandlers — the published address (log 0039)', () => {
  const draftTarget = { authorIds: ['author-2'], state: 'draft' as const }

  test('publishing holds the typed address', async () => {
    articleFindUniqueOrThrowMock.mockResolvedValue(completeArticle)

    await articleContentStateHandlers.publish(request, {
      id: 'a1',
      target: draftTarget,
    })

    expect(articleUpdateMock.mock.lastCall?.[0].data).toMatchObject({
      publishedSlug: 'clanek',
      state: 'published',
    })
  })

  test('publishing makes the share crop of the main image (log 0076)', async () => {
    articleFindUniqueOrThrowMock.mockResolvedValue({
      ...completeArticle,
      featuredImageId: 'image-1',
    })

    await articleContentStateHandlers.publish(request, {
      id: 'a1',
      target: draftTarget,
    })

    expect(ensureArticleOgImageMock).toHaveBeenCalledWith('image-1')
  })

  test('an address another article holds blocks the publish', async () => {
    articleFindUniqueOrThrowMock.mockResolvedValue(completeArticle)
    articleFindManyMock.mockResolvedValue([{ publishedSlug: 'clanek' }])

    const result = await articleContentStateHandlers.publish(request, {
      id: 'a1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: ['Adresa je obsazená.'] })
    expect(articleUpdateMock).not.toHaveBeenCalled()
  })

  test('an address taken between the check and the write blocks it too', async () => {
    articleFindUniqueOrThrowMock.mockResolvedValue(completeArticle)
    articleUpdateMock.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        clientVersion: 'test',
        code: 'P2002',
      }),
    )

    const result = await articleContentStateHandlers.publish(request, {
      id: 'a1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: ['Adresa je obsazená.'] })
    expect(recordContentLogMock).not.toHaveBeenCalled()
  })

  test('an address cleared since the check publishes nothing', async () => {
    articleFindUniqueOrThrowMock.mockResolvedValue(completeArticle)
    transactionFindUniqueOrThrowMock.mockResolvedValue({ slug: null })

    const result = await articleContentStateHandlers.publish(request, {
      id: 'a1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: ['Chybí adresa.'] })
    expect(articleUpdateMock).not.toHaveBeenCalled()
  })

  test('an address another article holds blocks the approval', async () => {
    articleFindUniqueOrThrowMock.mockResolvedValue({
      ...completeArticle,
      submittedAt: new Date(),
    })
    articleFindManyMock.mockResolvedValue([{ publishedSlug: 'clanek' }])

    const result = await articleContentStateHandlers.review(request, {
      id: 'a1',
      target: draftTarget,
    })

    expect(result).toEqual({ missing: ['Adresa je obsazená.'] })
    expect(reviewFindFirstMock).not.toHaveBeenCalled()
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
