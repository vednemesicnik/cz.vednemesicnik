import { beforeEach, describe, expect, test, vi } from 'vitest'

import { articleContentStateHandlers } from './content-state-handlers.server'

// Pass-through the permission wrapper and mock the two Prisma writes so this
// exercises the article config's applyState: the entity row clears reviews on a
// draft transition, but the mirrored PageSEO row must not (updateMany rejects
// nested relation writes).
const {
  withAuthorPermissionMock,
  articleFindUniqueOrThrowMock,
  articleUpdateMock,
  deleteRowWithImagesMock,
  pageSeoUpdateManyMock,
  reviewFindFirstMock,
} = vi.hoisted(() => ({
  articleFindUniqueOrThrowMock: vi.fn(),
  articleUpdateMock: vi.fn(),
  deleteRowWithImagesMock: vi.fn(),
  pageSeoUpdateManyMock: vi.fn(),
  reviewFindFirstMock: vi.fn(),
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

vi.mock('~/utils/db.server', () => ({
  prisma: {
    article: {
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
  excerpt: 'Perex',
  images: [],
  publishedAt: null,
  reviews: [{ reviewer: { role: { level: 1 } } }],
  slug: 'clanek',
  title: 'Článek',
}

beforeEach(() => {
  articleUpdateMock.mockResolvedValue({ slug: 'clear-redirect-test' })
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
      where: { id: 'a1' },
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
      excerpt: null,
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
