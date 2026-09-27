import { beforeEach, describe, expect, test, vi } from 'vitest'

import { FEATURED_IMAGE_SOURCE } from '~/config/featured-image-config'

import { updateArticle } from './update-article.server'

// Pass-through permission wrapper and mocked Prisma + image store. The queued
// Prisma operations return tags so the test can see what went into the
// transaction; `deleteRowWithImages` keeps its real ordering (row, then files).
const mocks = vi.hoisted(() => ({
  articleImageCreate: vi.fn(),
  articleImageDeleteMany: vi.fn(),
  articleImageFindMany: vi.fn(),
  articleUpdate: vi.fn(),
  pageSeoUpsert: vi.fn(),
  storeDelete: vi.fn(),
  storeImageVariants: vi.fn(),
  transaction: vi.fn(),
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

vi.mock('~/utils/db.server', () => ({
  prisma: {
    $transaction: mocks.transaction,
    article: { update: mocks.articleUpdate },
    articleImage: {
      create: mocks.articleImageCreate,
      deleteMany: mocks.articleImageDeleteMany,
      findMany: mocks.articleImageFindMany,
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    pageSEO: { upsert: mocks.pageSeoUpsert },
  },
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteImageVersion: vi.fn(),
  deleteRowWithImages: async (
    loadImageIds: () => Promise<string[]>,
    deleteRow: () => Promise<unknown>,
  ) => {
    const imageIds = await loadImageIds()
    const result = await deleteRow()
    mocks.storeDelete(imageIds)
    return result
  },
  storeImageVariants: mocks.storeImageVariants,
}))

vi.mock(
  '~/routes/administration/articles/utils/resolve-article-featured-image-seo.server',
  () => ({
    resolveArticleFeaturedImageSeo: async () => ({
      ogImageUrl: null,
      twitterImageUrl: null,
    }),
  }),
)

const request = new Request('https://test.local/')

const options = {
  articleId: 'article-1',
  authorIds: ['author-1'],
  content: '<p>Text</p>',
  existingImages: [{ altText: 'Kept', id: 'image-kept' }],
  featuredImage: { source: FEATURED_IMAGE_SOURCE.NONE },
  slug: 'article',
  state: 'draft' as const,
  title: 'Article',
} satisfies Parameters<typeof updateArticle>[1]

const newImage = {
  altText: 'New',
  file: new File(['image'], 'new.png', { type: 'image/png' }),
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.articleImageFindMany.mockResolvedValue([{ id: 'image-removed' }])
  mocks.articleImageDeleteMany.mockReturnValue('delete-removed-images')
  mocks.articleImageCreate.mockReturnValue('create-image')
  mocks.articleUpdate.mockReturnValue('update-article')
  mocks.pageSeoUpsert.mockReturnValue('upsert-page-seo')
  mocks.transaction.mockImplementation(async (operations: unknown[]) =>
    operations.map(() => ({ id: 'created-image' })),
  )
})

describe('updateArticle — removed images', () => {
  test('keeps a removed image when a new image fails to store', async () => {
    mocks.storeImageVariants.mockRejectedValue(new Error('sharp failed'))

    await expect(
      updateArticle(request, { ...options, images: [newImage] }),
    ).rejects.toThrow('sharp failed')

    expect(mocks.articleImageDeleteMany).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.storeDelete).not.toHaveBeenCalled()
  })

  test('keeps a removed image when the article write fails', async () => {
    mocks.transaction.mockRejectedValue(new Error('unique constraint'))

    await expect(updateArticle(request, options)).rejects.toThrow(
      'unique constraint',
    )

    expect(mocks.storeDelete).not.toHaveBeenCalled()
  })

  test('deletes the removed image row with the article update, then its files', async () => {
    const order: string[] = []
    mocks.transaction.mockImplementation(async () => {
      order.push('transaction')
      return []
    })
    mocks.storeDelete.mockImplementation(() => {
      order.push('delete-files')
    })

    await updateArticle(request, options)

    expect(mocks.articleImageDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['image-removed'] } },
    })
    expect(mocks.transaction).toHaveBeenCalledWith([
      'delete-removed-images',
      'update-article',
      'upsert-page-seo',
    ])
    expect(mocks.storeDelete).toHaveBeenCalledWith(['image-removed'])
    expect(order).toEqual(['transaction', 'delete-files'])
  })
})
