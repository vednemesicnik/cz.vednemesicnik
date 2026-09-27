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
  articleImageUpdate: vi.fn(),
  articleUpdate: vi.fn(),
  pageSeoUpsert: vi.fn(),
  replacedVersionCleanup: vi.fn(),
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
      update: mocks.articleImageUpdate,
    },
    pageSEO: { upsert: mocks.pageSeoUpsert },
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
  state: 'draft' as const,
  title: 'Article',
} satisfies Parameters<typeof updateArticle>[1]

beforeEach(() => {
  vi.clearAllMocks()
  // The removed-images lookup filters by article; the version lookup by ids.
  mocks.articleImageFindMany.mockImplementation(
    async ({ where }: { where: { articleId?: string } }) =>
      where.articleId ? [{ id: 'image-removed' }] : [],
  )
  mocks.articleImageDeleteMany.mockReturnValue('delete-removed-images')
  mocks.articleImageCreate.mockReturnValue('create-image')
  mocks.articleImageUpdate.mockReturnValue('update-image')
  mocks.articleUpdate.mockReturnValue('update-article')
  mocks.pageSeoUpsert.mockReturnValue('upsert-page-seo')
  mocks.storeImageVariants.mockResolvedValue({
    intrinsicHeight: 800,
    intrinsicWidth: 1200,
    placeholderDataUrl: 'data:',
    version: 'version-1',
  })
  mocks.transaction.mockResolvedValue([])
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
      'delete-removed-images',
      'create-image',
      'update-image',
      'update-article',
      'upsert-page-seo',
    ])
    expect(mocks.storeDelete).not.toHaveBeenCalled()
    expect(mocks.replacedVersionCleanup).not.toHaveBeenCalled()
  })
})

describe('updateArticle — a successful save', () => {
  test('deletes the removed image row in the transaction, then its files', async () => {
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
      return []
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
