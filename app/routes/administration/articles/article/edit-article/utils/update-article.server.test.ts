import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { FEATURED_IMAGE_SOURCE } from '~/config/featured-image-config'

import { updateArticle } from './update-article.server'

// Pass-through permission wrapper and mocked Prisma + image store. The queued
// Prisma operations return tags so the test can see what went into the
// transaction; `deleteRowWithImages` keeps its real ordering (row, then files).
const mocks = vi.hoisted(() => ({
  articleFindUnique: vi.fn(),
  articleImageAggregate: vi.fn(),
  articleImageCreate: vi.fn(),
  articleImageDeleteMany: vi.fn(),
  articleImageFindMany: vi.fn(),
  articleImageUpdate: vi.fn(),
  articleUpdate: vi.fn(),
  articleUpdateMany: vi.fn(),
  checkAuthorPermission: vi.fn(),
  pageSeoDeleteMany: vi.fn(),
  pageSeoUpsert: vi.fn(),
  permissionContext: vi.fn(),
  publishContentEvent: vi.fn(),
  replacedVersionCleanup: vi.fn(),
  storeDelete: vi.fn(),
  storeImageVariants: vi.fn(),
  transaction: vi.fn(),
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
    $transaction: mocks.transaction,
    article: {
      findUnique: mocks.articleFindUnique,
      update: mocks.articleUpdate,
      updateMany: mocks.articleUpdateMany,
    },
    articleImage: {
      aggregate: mocks.articleImageAggregate,
      create: mocks.articleImageCreate,
      deleteMany: mocks.articleImageDeleteMany,
      findMany: mocks.articleImageFindMany,
      update: mocks.articleImageUpdate,
    },
    pageSEO: {
      deleteMany: mocks.pageSeoDeleteMany,
      upsert: mocks.pageSeoUpsert,
    },
  },
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteRowWithImages: async (
    loadImageIds: () => Promise<string[]>,
    deleteRow: () => Promise<unknown>,
  ) => {
    const imageIds = await loadImageIds()
    const result = await deleteRow()
    mocks.storeDelete(imageIds)
    return result
  },
  prepareCoverReplacement: async ({
    altText,
    file,
  }: {
    altText: string
    file: File | undefined
  }) => ({
    cleanup: file ? mocks.replacedVersionCleanup : async () => {},
    data: file
      ? { altText, intrinsicWidth: 1200, version: 'version-2' }
      : { altText },
  }),
  storeImageVariants: mocks.storeImageVariants,
}))

vi.mock(
  '~/routes/administration/articles/utils/resolve-article-featured-image-seo.server',
  () => ({
    buildArticleFeaturedImageSeo: async () => ({
      ogImageUrl: 'og-new',
      twitterImageUrl: 'og-new',
    }),
    resolveArticleFeaturedImageSeo: async () => ({
      ogImageUrl: null,
      twitterImageUrl: null,
    }),
  }),
)

const request = new Request('https://test.local/')

const imageFile = new File(['image'], 'image.png', { type: 'image/png' })

const options = {
  articleId: 'article-1',
  authorIds: ['author-1'],
  content: '<p>Text</p>',
  existingImages: [{ altText: 'Kept', id: 'image-kept' }],
  featuredImage: { source: FEATURED_IMAGE_SOURCE.NONE },
  slug: 'article',
  title: 'Article',
} satisfies Parameters<typeof updateArticle>[1]

const storedArticle = {
  authors: [{ id: 'author-1' }],
  firstContentAt: new Date('2026-09-20T10:00:00Z'),
  slug: 'article',
  state: 'draft',
  submittedAt: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.permissionContext.mockReturnValue({
    authorId: 'author-1',
    roleLevel: 1,
  })
  mocks.withAuthorPermission.mockImplementation(
    (
      _request: Request,
      { execute }: { execute: (context: unknown) => Promise<unknown> },
    ) => execute(mocks.permissionContext()),
  )
  // clearAllMocks keeps implementations; a test's denial must not leak.
  mocks.checkAuthorPermission.mockReset()
  mocks.articleFindUnique.mockResolvedValue(storedArticle)
  // The removed-images lookup filters by article; the version lookup by ids.
  mocks.articleImageFindMany.mockImplementation(
    async ({ where }: { where: { articleId?: string } }) =>
      where.articleId ? [{ id: 'image-removed' }] : [],
  )
  mocks.articleImageDeleteMany.mockReturnValue('delete-removed-images')
  mocks.articleImageCreate.mockReturnValue('create-image')
  mocks.articleImageUpdate.mockReturnValue('update-image')
  mocks.articleUpdate.mockReturnValue('update-article')
  mocks.articleUpdateMany.mockReturnValue('mark-first-content')
  mocks.articleImageAggregate.mockResolvedValue({ _max: { position: 1 } })
  mocks.pageSeoDeleteMany.mockReturnValue('delete-orphan-page-seo')
  mocks.pageSeoUpsert.mockReturnValue('upsert-page-seo')
  mocks.storeImageVariants.mockResolvedValue({
    intrinsicHeight: 800,
    intrinsicWidth: 1200,
    placeholderDataUrl: 'data:',
    version: 'version-1',
  })
  // The first entry is the first-content mark; 0 rows: not the first save.
  mocks.transaction.mockResolvedValue([{ count: 0 }])
})

describe('updateArticle — the permission follows the stored article', () => {
  test('checks the stored authors and state, not the ones the form sends', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      authors: [{ id: 'author-2' }],
      state: 'published',
    })

    await updateArticle(request, options)

    expect(mocks.withAuthorPermission).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        action: 'update',
        entity: 'article',
        target: { authorIds: ['author-2'], state: 'published' },
      }),
    )
  })

  test('checks the authors it sets against the stored state', async () => {
    await updateArticle(request, { ...options, authorIds: ['author-3'] })

    expect(mocks.checkAuthorPermission).toHaveBeenCalledWith(
      mocks.permissionContext(),
      {
        action: 'update',
        entity: 'article',
        state: 'draft',
        targetAuthorIds: ['author-3'],
      },
    )
  })

  test('writes nothing when the new authors are not allowed', async () => {
    mocks.checkAuthorPermission.mockImplementation(() => {
      throw data(null, { status: 403 })
    })

    await expect(updateArticle(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('keeps the stored state', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      state: 'archived',
    })

    await updateArticle(request, options)

    expect(mocks.articleUpdate.mock.calls[0][0].data).not.toHaveProperty(
      'state',
    )
    const pageSeo = mocks.pageSeoUpsert.mock.calls[0][0]
    expect(pageSeo.create.state).toBe('archived')
    expect(pageSeo.update).not.toHaveProperty('state')
  })

  test('answers a missing article with 404', async () => {
    mocks.articleFindUnique.mockResolvedValue(null)

    await expect(updateArticle(request, options)).rejects.toMatchObject({
      init: { status: 404 },
    })
    expect(mocks.withAuthorPermission).not.toHaveBeenCalled()
  })
})

describe('updateArticle — a failed save changes nothing', () => {
  test('keeps a removed image when a new image fails to store', async () => {
    mocks.storeImageVariants.mockRejectedValue(new Error('sharp failed'))

    await expect(
      updateArticle(request, {
        ...options,
        images: [{ altText: 'New', file: imageFile }],
      }),
    ).rejects.toThrow('sharp failed')

    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.storeDelete).not.toHaveBeenCalled()
  })

  test('keeps removed images and replaced versions when the article write fails', async () => {
    mocks.transaction.mockRejectedValue(new Error('unique constraint'))

    await expect(
      updateArticle(request, {
        ...options,
        existingImages: [
          { altText: 'Kept', file: imageFile, id: 'image-kept' },
        ],
        images: [{ altText: 'New', file: imageFile }],
      }),
    ).rejects.toThrow('unique constraint')

    // Every row write was queued into the one failed transaction.
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
    expect(mocks.transaction).toHaveBeenCalledWith([
      'mark-first-content',
      'delete-orphan-page-seo',
      'delete-removed-images',
      'create-image',
      'update-image',
      'update-article',
      'upsert-page-seo',
    ])
    expect(mocks.storeDelete).not.toHaveBeenCalled()
    expect(mocks.replacedVersionCleanup).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })
})

describe('updateArticle — a successful save', () => {
  test('announces the update once the transaction commits', async () => {
    await updateArticle(request, options)

    expect(mocks.publishContentEvent).toHaveBeenCalledExactlyOnceWith(
      { change: 'update', entity: 'article', entityId: 'article-1' },
      mocks.permissionContext(),
    )
  })

  test('deletes the removed image row in the transaction, then its files', async () => {
    const order: string[] = []
    mocks.transaction.mockImplementation(async () => {
      order.push('transaction')
      return [{ count: 0 }]
    })
    mocks.storeDelete.mockImplementation(() => {
      order.push('delete-files')
    })

    await updateArticle(request, options)

    expect(mocks.articleImageDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['image-removed'] } },
    })
    expect(mocks.transaction).toHaveBeenCalledWith([
      'mark-first-content',
      'delete-orphan-page-seo',
      'delete-removed-images',
      'update-image',
      'update-article',
      'upsert-page-seo',
    ])
    expect(mocks.storeDelete).toHaveBeenCalledWith(['image-removed'])
    expect(order).toEqual(['transaction', 'delete-files'])
  })

  test('drops a replaced version only after the transaction commits', async () => {
    const order: string[] = []
    mocks.transaction.mockImplementation(async () => {
      order.push('transaction')
      return [{ count: 0 }]
    })
    mocks.replacedVersionCleanup.mockImplementation(async () => {
      order.push('cleanup')
    })

    await updateArticle(request, {
      ...options,
      existingImages: [{ altText: 'Kept', file: imageFile, id: 'image-kept' }],
    })

    expect(order).toEqual(['transaction', 'cleanup'])
  })

  test('builds SEO for a new featured image from its stored metadata', async () => {
    await updateArticle(request, {
      ...options,
      featuredImage: { index: 0, source: FEATURED_IMAGE_SOURCE.NEW },
      images: [{ altText: 'New', file: imageFile }],
    })

    const articleData = mocks.articleUpdate.mock.calls[0][0].data
    const createdImage = mocks.articleImageCreate.mock.calls[0][0].data
    expect(articleData.featuredImageId).toBe(createdImage.id)
    expect(mocks.pageSeoUpsert.mock.calls[0][0].update.ogImageUrl).toBe(
      'og-new',
    )
  })
})

describe('updateArticle — a submitted article', () => {
  const submittedAt = new Date('2026-09-25T10:00:00Z')

  test('is locked for its authors', async () => {
    mocks.permissionContext.mockReturnValue({
      authorId: 'author-1',
      roleLevel: 3,
    })
    mocks.articleFindUnique.mockResolvedValue({ ...storedArticle, submittedAt })

    await expect(updateArticle(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('the Coordinator corrects it and the submission and approval stay', async () => {
    mocks.articleFindUnique.mockResolvedValue({ ...storedArticle, submittedAt })

    await updateArticle(request, options)

    const articleData = mocks.articleUpdate.mock.calls[0][0].data
    expect(articleData).not.toHaveProperty('submittedAt')
    expect(articleData).not.toHaveProperty('reviews')
    expect(mocks.transaction).toHaveBeenCalledOnce()
  })
})

describe('updateArticle — the first content of a new draft (decision 0020)', () => {
  const emptyDraft = { ...storedArticle, firstContentAt: null, slug: null }

  test('marks the first content only where none is stored yet', async () => {
    await updateArticle(request, options)

    expect(mocks.articleUpdateMany).toHaveBeenCalledWith({
      data: { firstContentAt: expect.any(Date) },
      where: { firstContentAt: null, id: 'article-1' },
    })
  })

  test('is the creation in the history when it marks the draft', async () => {
    mocks.articleFindUnique.mockResolvedValue(emptyDraft)
    mocks.transaction.mockResolvedValue([{ count: 1 }])

    await updateArticle(request, options)

    expect(mocks.publishContentEvent).toHaveBeenCalledExactlyOnceWith(
      { change: 'create', entity: 'article', entityId: 'article-1' },
      mocks.permissionContext(),
    )
  })

  test('stays an update when another save marked it first', async () => {
    mocks.articleFindUnique.mockResolvedValue(emptyDraft)

    await updateArticle(request, options)

    expect(mocks.publishContentEvent.mock.lastCall?.[0].change).toBe('update')
  })

  test('marks and logs nothing without a title, text or image', async () => {
    mocks.articleFindUnique.mockResolvedValue(emptyDraft)
    mocks.transaction.mockResolvedValue([{ count: 1 }])

    await updateArticle(request, {
      ...options,
      content: '',
      existingImages: [],
      title: '',
    })

    expect(mocks.articleUpdateMany.mock.lastCall?.[0].data).toEqual({
      firstContentAt: null,
    })
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })
})

describe('updateArticle — the PageSEO row follows the address', () => {
  test('creates it at the first address of a draft', async () => {
    mocks.articleFindUnique.mockResolvedValue({ ...storedArticle, slug: null })

    await updateArticle(request, options)

    const pageSeo = mocks.pageSeoUpsert.mock.lastCall?.[0]
    expect(pageSeo.where).toEqual({ pathname: '/articles/article' })
    expect(pageSeo.create.pathname).toBe('/articles/article')
  })

  test('moves it when the address changes', async () => {
    await updateArticle(request, { ...options, slug: 'renamed' })

    const pageSeo = mocks.pageSeoUpsert.mock.lastCall?.[0]
    expect(pageSeo.where).toEqual({ pathname: '/articles/article' })
    expect(pageSeo.update.pathname).toBe('/articles/renamed')
    expect(mocks.pageSeoDeleteMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { pathname: '/articles/renamed' },
          { pathname: { not: '/articles/article' } },
        ],
      },
    })
  })
})

describe('updateArticle — the gallery order (design 24b)', () => {
  test('puts new images after the existing ones', async () => {
    await updateArticle(request, {
      ...options,
      images: [
        { altText: 'First', file: imageFile },
        { altText: 'Second', file: imageFile },
      ],
    })

    const positions = mocks.articleImageCreate.mock.calls.map(
      ([argument]) => argument.data.position,
    )
    expect(positions).toEqual([2, 3])
  })
})
