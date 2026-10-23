import { createId } from '@paralleldrive/cuid2'
import sharp from 'sharp'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ARTICLE_IMAGE_CONFIG } from '~/config/article-image-config'

import { uploadArticleImage } from './upload-article-image.server'

const mocks = vi.hoisted(() => ({
  articleImageAggregate: vi.fn(),
  articleImageCreate: vi.fn(),
  articleImageDelete: vi.fn(),
  articleImageFindUnique: vi.fn(),
  articleImageUpdate: vi.fn(),
  buildArticlePageSeoImageWrites: vi.fn(),
  createImageSources: vi.fn(),
  deleteImage: vi.fn(),
  deleteImageVersion: vi.fn(),
  isImageIdOwnedElsewhere: vi.fn(),
  saveArticleImageChange: vi.fn(),
  storeImageVariants: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock(
  '~/routes/administration/articles/utils/build-article-page-seo-image-writes.server',
  () => ({
    buildArticlePageSeoImageWrites: mocks.buildArticlePageSeoImageWrites,
  }),
)

vi.mock('~/utils/db.server', () => ({
  prisma: {
    $transaction: mocks.transaction,
    articleImage: {
      aggregate: mocks.articleImageAggregate,
      create: mocks.articleImageCreate,
      delete: mocks.articleImageDelete,
      findUnique: mocks.articleImageFindUnique,
      update: mocks.articleImageUpdate,
    },
  },
}))

vi.mock('~/utils/image-store/create-image-sources', () => ({
  createImageSources: mocks.createImageSources,
}))

vi.mock('~/utils/image-store/is-image-id-owned-elsewhere.server', () => ({
  isImageIdOwnedElsewhere: mocks.isImageIdOwnedElsewhere,
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteImage: mocks.deleteImage,
  deleteImageVersion: mocks.deleteImageVersion,
  storeImageVariants: mocks.storeImageVariants,
}))

vi.mock('./save-article-image-change.server', () => ({
  saveArticleImageChange: mocks.saveArticleImageChange,
}))

const request = new Request('https://test.local/')
const context = { authorId: 'author-1', roleLevel: 1 }
const imageId = createId()

const meta = {
  intrinsicHeight: 600,
  intrinsicWidth: 900,
  placeholderDataUrl: 'data:image/jpeg;base64,AAAA',
  version: 'v2',
}

const buildOptions = (overrides: Record<string, unknown> = {}) => ({
  altText: 'Alt',
  articleId: 'article-1',
  description: 'Caption',
  file: new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' }),
  imageId,
  tabId: 'tab-1',
  ...overrides,
})

const run = async (
  overrides: Record<string, unknown> = {},
  article = {
    featuredImageId: null as string | null,
    publishedSlug: 'article',
  },
) => {
  await uploadArticleImage(request, buildOptions(overrides))
  const { prepare } = mocks.saveArticleImageChange.mock.lastCall?.[1] ?? {}
  return prepare(context, article)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.saveArticleImageChange.mockResolvedValue({ status: 'saved' })
  // A new image by default.
  mocks.articleImageFindUnique.mockResolvedValue(null)
  mocks.isImageIdOwnedElsewhere.mockResolvedValue(false)
  mocks.storeImageVariants.mockResolvedValue(meta)
  mocks.createImageSources.mockReturnValue({ src: '/preview.jpg' })
  mocks.articleImageAggregate.mockResolvedValue({ _max: { position: 2 } })
  mocks.articleImageCreate.mockReturnValue('create-image')
  mocks.articleImageUpdate.mockReturnValue('update-image')
  mocks.buildArticlePageSeoImageWrites.mockResolvedValue(['seo-write'])
  mocks.deleteImage.mockResolvedValue(undefined)
  mocks.deleteImageVersion.mockResolvedValue(undefined)
})

describe('uploadArticleImage — the input', () => {
  test.each([
    ['an id that is not a cuid', { imageId: 'not a cuid!' }],
    [
      'an empty file',
      { file: new File([], 'empty.jpg', { type: 'image/jpeg' }) },
    ],
    [
      'a file over the limit',
      {
        file: new File(
          [new Uint8Array(ARTICLE_IMAGE_CONFIG.maxFileBytes + 1)],
          'big.jpg',
          { type: 'image/jpeg' },
        ),
      },
    ],
    [
      'a file that is not an image',
      { file: new File(['text'], 'note.txt', { type: 'text/plain' }) },
    ],
  ])('answers 400 for %s', async (_name, overrides) => {
    await expect(
      uploadArticleImage(request, buildOptions(overrides)),
    ).rejects.toMatchObject({ init: { status: 400 } })

    expect(mocks.saveArticleImageChange).not.toHaveBeenCalled()
  })

  test('accepts a file of exactly the limit', async () => {
    await uploadArticleImage(
      request,
      buildOptions({
        file: new File(
          [new Uint8Array(ARTICLE_IMAGE_CONFIG.maxFileBytes)],
          'edge.jpg',
          { type: 'image/jpeg' },
        ),
      }),
    )

    expect(mocks.saveArticleImageChange).toHaveBeenCalled()
  })

  test('lands without the hold, for the article and the tab', async () => {
    await uploadArticleImage(request, buildOptions())

    expect(mocks.saveArticleImageChange).toHaveBeenCalledWith(request, {
      articleId: 'article-1',
      isCancellable: true,
      landsWithoutHold: true,
      prepare: expect.any(Function),
      tabId: 'tab-1',
    })
  })
})

describe('uploadArticleImage — the image id', () => {
  test('answers 400 for a new id another record owns', async () => {
    mocks.isImageIdOwnedElsewhere.mockResolvedValue(true)

    await expect(run()).rejects.toMatchObject({ init: { status: 400 } })

    expect(mocks.isImageIdOwnedElsewhere).toHaveBeenCalledWith([imageId])
    expect(mocks.storeImageVariants).not.toHaveBeenCalled()
  })

  test('answers 400 for a stored id of another article', async () => {
    mocks.articleImageFindUnique.mockResolvedValue({
      articleId: 'article-2',
      version: 'v1',
    })

    await expect(run()).rejects.toMatchObject({ init: { status: 400 } })

    expect(mocks.isImageIdOwnedElsewhere).not.toHaveBeenCalled()
    expect(mocks.storeImageVariants).not.toHaveBeenCalled()
  })
})

describe('uploadArticleImage — a new image', () => {
  test('creates the row after the last image, with its file name', async () => {
    const prepared = await run()

    expect(mocks.storeImageVariants).toHaveBeenCalledWith(
      imageId,
      expect.any(File),
    )
    expect(mocks.articleImageAggregate).toHaveBeenCalledWith({
      _max: { position: true },
      where: { articleId: 'article-1' },
    })
    expect(mocks.articleImageCreate).toHaveBeenCalledWith({
      data: {
        ...meta,
        altText: 'Alt',
        articleId: 'article-1',
        description: 'Caption',
        fileName: 'photo.jpg',
        id: imageId,
        position: 3,
      },
      select: { id: true },
    })
    expect(prepared.writes).toEqual(['create-image'])
    expect(prepared.addsContent).toBe(true)
    expect(prepared.answer).toEqual({
      fileName: 'photo.jpg',
      previewUrl: '/preview.jpg',
    })
    expect(mocks.createImageSources).toHaveBeenCalledWith('article-image', {
      id: imageId,
      ...meta,
    })
  })

  test('starts the gallery at position 0', async () => {
    mocks.articleImageAggregate.mockResolvedValue({ _max: { position: null } })

    await run()

    expect(mocks.articleImageCreate.mock.lastCall?.[0].data.position).toBe(0)
  })

  test('stores an empty caption as null', async () => {
    await run({ description: '' })

    expect(mocks.articleImageCreate.mock.lastCall?.[0].data.description).toBe(
      null,
    )
  })

  test('answers a null preview when there is no source', async () => {
    mocks.createImageSources.mockReturnValue({ src: undefined })

    const prepared = await run()

    expect(prepared.answer.previewUrl).toBeNull()
  })

  test('drops the stored files when the row did not commit', async () => {
    const prepared = await run()

    expect(prepared.onCommitted).toBeUndefined()

    await prepared.onRefused()

    expect(mocks.deleteImage).toHaveBeenCalledWith(imageId)
  })

  test('keeps the files another upload of the same id committed meanwhile', async () => {
    const prepared = await run()
    // A retry whose answer was lost landed first, with the same version.
    mocks.articleImageFindUnique.mockResolvedValue({ version: 'v2' })

    await prepared.onRefused()

    expect(mocks.deleteImage).not.toHaveBeenCalled()
    expect(mocks.deleteImageVersion).not.toHaveBeenCalled()
  })

  test('answers failed and drops the files when processing fails', async () => {
    mocks.storeImageVariants.mockRejectedValue(new Error('corrupt'))

    const prepared = await run()

    expect(prepared).toEqual({ status: 'failed' })
    expect(mocks.deleteImage).toHaveBeenCalledWith(imageId)
    expect(mocks.articleImageCreate).not.toHaveBeenCalled()
  })

  test('answers failed with the reason for an image over the pixel budget, storing nothing', async () => {
    const huge = new File(
      [
        await sharp({
          create: {
            background: '#fff',
            channels: 3,
            height: 8000,
            width: 8000,
          },
        })
          .png({ compressionLevel: 1 })
          .toBuffer(),
      ],
      'huge.png',
      { type: 'image/png' },
    )

    const prepared = await run({ file: huge })

    expect(prepared).toEqual({ reason: 'over-pixel-budget', status: 'failed' })
    expect(mocks.storeImageVariants).not.toHaveBeenCalled()
  })

  test('a cancel during the commit deletes the row and its files (bxy8xxqs)', async () => {
    const prepared = await run()

    await prepared.onCancelled()

    expect(mocks.articleImageDelete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: imageId },
    })
    expect(mocks.deleteImage).toHaveBeenCalledWith(imageId)
  })

  test('adds no sharing preview for an image that is not the main one', async () => {
    const prepared = await run(
      {},
      { featuredImageId: 'other', publishedSlug: 'article' },
    )

    expect(mocks.buildArticlePageSeoImageWrites).not.toHaveBeenCalled()
    expect(prepared.writes).toEqual(['create-image'])
  })

  test('points the sharing preview at the new version of the main image', async () => {
    const prepared = await run(
      {},
      { featuredImageId: imageId, publishedSlug: 'article' },
    )

    expect(mocks.buildArticlePageSeoImageWrites).toHaveBeenCalledWith({
      featuredImage: { id: imageId, ...meta },
      publishedSlug: 'article',
    })
    expect(prepared.writes).toEqual(['create-image', 'seo-write'])
  })
})

describe('uploadArticleImage — a stored image', () => {
  const previousMeta = {
    intrinsicHeight: 400,
    intrinsicWidth: 500,
    placeholderDataUrl: 'data:image/jpeg;base64,BBBB',
    version: 'v1',
  }

  beforeEach(() => {
    mocks.articleImageFindUnique.mockResolvedValue({
      ...previousMeta,
      articleId: 'article-1',
      fileName: 'stary.jpg',
    })
  })

  test('a cancel during the commit writes the previous version back (bxy8xxqs)', async () => {
    const prepared = await run()
    mocks.articleImageUpdate.mockReturnValue('restore-image')

    await prepared.onCancelled()

    expect(mocks.articleImageUpdate).toHaveBeenLastCalledWith({
      data: { ...previousMeta, fileName: 'stary.jpg' },
      select: { id: true },
      where: { id: imageId },
    })
    expect(mocks.transaction).toHaveBeenCalledWith(['restore-image'])
    expect(mocks.deleteImageVersion).toHaveBeenCalledWith(imageId, 'v2')
    expect(mocks.deleteImage).not.toHaveBeenCalled()
  })

  test('a cancelled main image points the sharing preview back', async () => {
    const prepared = await run(
      {},
      { featuredImageId: imageId, publishedSlug: 'article' },
    )
    mocks.articleImageUpdate.mockReturnValue('restore-image')
    mocks.buildArticlePageSeoImageWrites.mockResolvedValue(['previous-seo'])

    await prepared.onCancelled()

    expect(mocks.buildArticlePageSeoImageWrites).toHaveBeenLastCalledWith({
      featuredImage: { id: imageId, ...previousMeta },
      publishedSlug: 'article',
    })
    expect(mocks.transaction).toHaveBeenCalledWith([
      'restore-image',
      'previous-seo',
    ])
  })

  test('replaces the file and the metadata, keeping the position', async () => {
    const prepared = await run()

    expect(mocks.articleImageUpdate).toHaveBeenCalledWith({
      data: { ...meta, fileName: 'photo.jpg' },
      select: { id: true },
      where: { id: imageId },
    })
    expect(mocks.articleImageCreate).not.toHaveBeenCalled()
    expect(mocks.articleImageAggregate).not.toHaveBeenCalled()
    expect(prepared.writes).toEqual(['update-image'])
    expect(prepared.addsContent).toBeUndefined()
    expect(prepared.answer).toEqual({
      fileName: 'photo.jpg',
      previewUrl: '/preview.jpg',
    })
  })

  test('drops the previous version only once the row committed', async () => {
    const prepared = await run()

    expect(mocks.deleteImageVersion).not.toHaveBeenCalled()

    await prepared.onCommitted()

    expect(mocks.deleteImageVersion).toHaveBeenCalledWith(imageId, 'v1')
    expect(mocks.deleteImage).not.toHaveBeenCalled()
  })

  test('drops the new version when the row did not commit', async () => {
    const prepared = await run()

    await prepared.onRefused()

    expect(mocks.deleteImageVersion).toHaveBeenCalledWith(imageId, 'v2')
    expect(mocks.deleteImage).not.toHaveBeenCalled()
  })

  test('keeps the files when the version did not change', async () => {
    mocks.storeImageVariants.mockResolvedValue({ ...meta, version: 'v1' })

    const prepared = await run()
    await prepared.onCommitted()
    await prepared.onRefused()

    expect(mocks.deleteImageVersion).not.toHaveBeenCalled()
  })

  test('keeps the stored image when processing fails', async () => {
    mocks.storeImageVariants.mockRejectedValue(new Error('corrupt'))

    const prepared = await run()

    expect(prepared).toEqual({ status: 'failed' })
    expect(mocks.deleteImage).not.toHaveBeenCalled()
    expect(mocks.articleImageUpdate).not.toHaveBeenCalled()
  })

  test('points the sharing preview at the new version of the main image', async () => {
    const prepared = await run(
      {},
      { featuredImageId: imageId, publishedSlug: 'article' },
    )

    expect(mocks.buildArticlePageSeoImageWrites).toHaveBeenCalledWith({
      featuredImage: { id: imageId, ...meta },
      publishedSlug: 'article',
    })
    expect(prepared.writes).toEqual(['update-image', 'seo-write'])
  })
})
