import { beforeEach, describe, expect, test, vi } from 'vitest'

import { removeArticleImage } from './remove-article-image.server'

const mocks = vi.hoisted(() => ({
  articleImageDelete: vi.fn(),
  articleImageFindFirst: vi.fn(),
  buildArticlePageSeoImageWrites: vi.fn(),
  deleteImage: vi.fn(),
  saveArticleImageChange: vi.fn(),
}))

vi.mock(
  '~/routes/administration/articles/utils/build-article-page-seo-image-writes.server',
  () => ({
    buildArticlePageSeoImageWrites: mocks.buildArticlePageSeoImageWrites,
  }),
)

vi.mock('~/utils/db.server', () => ({
  prisma: {
    articleImage: {
      delete: mocks.articleImageDelete,
      findFirst: mocks.articleImageFindFirst,
    },
  },
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteImage: mocks.deleteImage,
}))

vi.mock('./save-article-image-change.server', () => ({
  saveArticleImageChange: mocks.saveArticleImageChange,
}))

const request = new Request('https://test.local/')
const options = { articleId: 'article-1', imageId: 'image-1', tabId: 'tab-1' }
const context = { authorId: 'author-1', roleLevel: 1 }

const run = async (
  article: { featuredImageId: string | null; slug: string } = {
    featuredImageId: null,
    slug: 'article',
  },
) => {
  await removeArticleImage(request, options)
  const { prepare } = mocks.saveArticleImageChange.mock.lastCall?.[1] ?? {}
  return prepare(context, article)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.saveArticleImageChange.mockResolvedValue({ status: 'saved' })
  mocks.articleImageFindFirst.mockResolvedValue({ id: 'image-1' })
  mocks.articleImageDelete.mockReturnValue('delete-image')
  mocks.buildArticlePageSeoImageWrites.mockResolvedValue(['seo-write'])
  mocks.deleteImage.mockResolvedValue(undefined)
})

describe('removeArticleImage', () => {
  test('saves for the article and the tab', async () => {
    await removeArticleImage(request, options)

    expect(mocks.saveArticleImageChange).toHaveBeenCalledWith(request, {
      articleId: 'article-1',
      prepare: expect.any(Function),
      tabId: 'tab-1',
    })
  })

  test('answers 400 for an image that is not the article’s', async () => {
    mocks.articleImageFindFirst.mockResolvedValue(null)

    await expect(run()).rejects.toMatchObject({ init: { status: 400 } })

    expect(mocks.articleImageFindFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { articleId: 'article-1', id: 'image-1' },
    })
    expect(mocks.articleImageDelete).not.toHaveBeenCalled()
  })

  test('deletes the row and keeps the files until it committed', async () => {
    const prepared = await run()

    expect(mocks.articleImageDelete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: 'image-1' },
    })
    expect(prepared.writes).toEqual(['delete-image'])
    expect(prepared.answer).toEqual({})
    expect(prepared.onRefused).toBeUndefined()
    expect(mocks.deleteImage).not.toHaveBeenCalled()

    await prepared.onCommitted()

    expect(mocks.deleteImage).toHaveBeenCalledWith('image-1')
  })

  test('leaves the sharing preview alone for an image that is not the main one', async () => {
    const prepared = await run({ featuredImageId: 'image-2', slug: 'article' })

    expect(mocks.buildArticlePageSeoImageWrites).not.toHaveBeenCalled()
    expect(prepared.writes).toEqual(['delete-image'])
  })

  test('clears the sharing preview when it was the main image', async () => {
    const prepared = await run({ featuredImageId: 'image-1', slug: 'article' })

    expect(mocks.buildArticlePageSeoImageWrites).toHaveBeenCalledWith({
      featuredImage: null,
      slug: 'article',
    })
    expect(prepared.writes).toEqual(['delete-image', 'seo-write'])
  })

  test('returns what the change returns', async () => {
    mocks.saveArticleImageChange.mockResolvedValue({
      heldByName: 'Jakub Novák',
      status: 'not-held',
    })

    await expect(removeArticleImage(request, options)).resolves.toEqual({
      heldByName: 'Jakub Novák',
      status: 'not-held',
    })
  })
})
