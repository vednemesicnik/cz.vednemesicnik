import { beforeEach, describe, expect, test, vi } from 'vitest'

import { setArticleFeaturedImage } from './set-article-featured-image.server'

const mocks = vi.hoisted(() => ({
  articleImageCount: vi.fn(),
  buildArticlePageSeoImageWrites: vi.fn(),
  saveArticleImageChange: vi.fn(),
}))

vi.mock(
  '~/routes/administration/articles/utils/build-article-page-seo-image-writes.server',
  () => ({
    buildArticlePageSeoImageWrites: mocks.buildArticlePageSeoImageWrites,
  }),
)

vi.mock('~/utils/db.server', () => ({
  prisma: { articleImage: { count: mocks.articleImageCount } },
}))

vi.mock('./save-article-image-change.server', () => ({
  saveArticleImageChange: mocks.saveArticleImageChange,
}))

const request = new Request('https://test.local/')
const context = { authorId: 'author-1', roleLevel: 1 }
const article = { featuredImageId: null, slug: 'article' }

const run = async (imageId: string | null) => {
  await setArticleFeaturedImage(request, {
    articleId: 'article-1',
    imageId,
    tabId: 'tab-1',
  })
  const { prepare } = mocks.saveArticleImageChange.mock.lastCall?.[1] ?? {}
  return prepare(context, article)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.saveArticleImageChange.mockResolvedValue({ status: 'saved' })
  mocks.articleImageCount.mockResolvedValue(1)
  mocks.buildArticlePageSeoImageWrites.mockResolvedValue(['seo-write'])
})

describe('setArticleFeaturedImage', () => {
  test('saves for the article and the tab', async () => {
    await run('image-1')

    expect(mocks.saveArticleImageChange).toHaveBeenCalledWith(request, {
      articleId: 'article-1',
      prepare: expect.any(Function),
      tabId: 'tab-1',
    })
  })

  test('answers 400 for an image that is not the article’s', async () => {
    mocks.articleImageCount.mockResolvedValue(0)

    await expect(run('image-foreign')).rejects.toMatchObject({
      init: { status: 400 },
    })

    expect(mocks.articleImageCount).toHaveBeenCalledWith({
      where: { articleId: 'article-1', id: 'image-foreign' },
    })
    expect(mocks.buildArticlePageSeoImageWrites).not.toHaveBeenCalled()
  })

  test('sets the main image and points the sharing preview at it', async () => {
    const prepared = await run('image-1')

    expect(prepared).toEqual({
      answer: {},
      articleData: { featuredImageId: 'image-1' },
      writes: ['seo-write'],
    })
    expect(mocks.buildArticlePageSeoImageWrites).toHaveBeenCalledWith({
      featuredImage: 'image-1',
      slug: 'article',
    })
  })

  test('clears the main image without looking for an image', async () => {
    const prepared = await run(null)

    expect(mocks.articleImageCount).not.toHaveBeenCalled()
    expect(prepared.articleData).toEqual({ featuredImageId: null })
    expect(mocks.buildArticlePageSeoImageWrites).toHaveBeenCalledWith({
      featuredImage: null,
      slug: 'article',
    })
  })

  test('writes no sharing preview for a draft without an address', async () => {
    mocks.buildArticlePageSeoImageWrites.mockResolvedValue([])

    const prepared = await run('image-1')

    expect(prepared.writes).toEqual([])
  })
})
