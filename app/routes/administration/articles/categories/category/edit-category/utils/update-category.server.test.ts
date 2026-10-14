import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { updateCategory } from './update-category.server'

const mocks = vi.hoisted(() => ({
  articleCategoryFindUnique: vi.fn(),
  articleCategoryUpdate: vi.fn(),
  checkAuthorPermission: vi.fn(),
  publishContentEvent: vi.fn(),
  withAuthorPermission: vi.fn(),
}))

// The content log has its own tests; here it only must not reach Prisma.
vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: vi.fn(),
}))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({ withAuthorPermission: mocks.withAuthorPermission }),
)

vi.mock(
  '~/utils/permissions/author/guards/check-author-permission.server',
  () => ({ checkAuthorPermission: mocks.checkAuthorPermission }),
)

vi.mock('~/utils/sse/publish-content-event.server', () => ({
  publishContentEvent: mocks.publishContentEvent,
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    articleCategory: {
      findUnique: mocks.articleCategoryFindUnique,
      update: mocks.articleCategoryUpdate,
    },
  },
}))

const request = new Request('https://test.local/')
const context = {
  authorId: 'author-1',
  authorName: 'Marie Horáková',
  roleLevel: 3,
}

const options = {
  authorId: 'author-1',
  categoryId: 'category-1',
  name: 'Kultura',
  slug: 'kultura',
}

const storedCategory = {
  authorId: 'author-1',
  state: 'draft',
  submittedAt: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.withAuthorPermission.mockImplementation(
    (
      _request: Request,
      { execute }: { execute: (context: unknown) => Promise<unknown> },
    ) => execute(context),
  )
  // clearAllMocks keeps implementations; a test's denial must not leak.
  mocks.checkAuthorPermission.mockReset()
  mocks.articleCategoryUpdate.mockResolvedValue({ id: 'category-1' })
  mocks.articleCategoryFindUnique.mockResolvedValue(storedCategory)
})

describe('updateCategory', () => {
  test('checks the stored author and state, not the ones the form sends', async () => {
    mocks.articleCategoryFindUnique.mockResolvedValue({
      ...storedCategory,
      authorId: 'author-2',
      state: 'published',
    })

    await updateCategory(request, options)

    expect(mocks.withAuthorPermission).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        action: 'update',
        entity: 'article_category',
        target: { authorIds: ['author-2'], state: 'published' },
      }),
    )
  })

  test('checks the author it sets against the stored state', async () => {
    await updateCategory(request, { ...options, authorId: 'author-3' })

    expect(mocks.checkAuthorPermission).toHaveBeenCalledWith(context, {
      action: 'update',
      entity: 'article_category',
      state: 'draft',
      targetAuthorIds: ['author-3'],
    })
  })

  test('writes nothing when the new author is not allowed', async () => {
    mocks.checkAuthorPermission.mockImplementation(() => {
      throw data(null, { status: 403 })
    })

    await expect(updateCategory(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.articleCategoryUpdate).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('refuses its author while the category is submitted', async () => {
    mocks.articleCategoryFindUnique.mockResolvedValue({
      ...storedCategory,
      submittedAt: new Date('2026-10-13T10:00:00Z'),
    })

    await expect(updateCategory(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.articleCategoryUpdate).not.toHaveBeenCalled()
  })

  test('answers a missing category with 404', async () => {
    mocks.articleCategoryFindUnique.mockResolvedValue(null)

    await expect(updateCategory(request, options)).rejects.toMatchObject({
      init: { status: 404 },
    })
    expect(mocks.withAuthorPermission).not.toHaveBeenCalled()
  })

  test('announces the updated category', async () => {
    await expect(updateCategory(request, options)).resolves.toEqual({
      id: 'category-1',
    })

    expect(mocks.publishContentEvent).toHaveBeenCalledExactlyOnceWith(
      {
        change: 'update',
        entity: 'article_category',
        entityId: 'category-1',
      },
      context,
    )
  })
})
