import { beforeEach, describe, expect, test, vi } from 'vitest'

import { setArticleFeaturedImage } from './set-article-featured-image.server'

const mocks = vi.hoisted(() => ({
  articleImageFindMany: vi.fn(),
  articleImageUpdate: vi.fn(),
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
  prisma: {
    articleImage: {
      findMany: mocks.articleImageFindMany,
      update: mocks.articleImageUpdate,
    },
  },
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
  mocks.articleImageFindMany.mockResolvedValue([
    { id: 'image-0' },
    { id: 'image-1' },
    { id: 'image-2' },
  ])
  mocks.articleImageUpdate.mockImplementation(
    ({ data: { position }, where: { id } }) => `${id}@${position}`,
  )
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
    await expect(run('image-foreign')).rejects.toMatchObject({
      init: { status: 400 },
    })

    expect(mocks.articleImageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { articleId: 'article-1' } }),
    )
    expect(mocks.buildArticlePageSeoImageWrites).not.toHaveBeenCalled()
  })

  test('sets the main image first and points the sharing preview at it', async () => {
    const prepared = await run('image-1')

    // The others keep their order behind it (yj2t50dd).
    expect(prepared).toEqual({
      answer: {},
      articleData: { featuredImageId: 'image-1' },
      writes: ['image-1@0', 'image-0@1', 'image-2@2', 'seo-write'],
    })
    expect(mocks.buildArticlePageSeoImageWrites).toHaveBeenCalledWith({
      featuredImage: 'image-1',
      slug: 'article',
    })
  })

  test('clears the main image and leaves the order as it is', async () => {
    const prepared = await run(null)

    expect(mocks.articleImageFindMany).not.toHaveBeenCalled()
    expect(prepared.articleData).toEqual({ featuredImageId: null })
    expect(prepared.writes).toEqual(['seo-write'])
    expect(mocks.buildArticlePageSeoImageWrites).toHaveBeenCalledWith({
      featuredImage: null,
      slug: 'article',
    })
  })

  test('writes no sharing preview for a draft without an address', async () => {
    mocks.buildArticlePageSeoImageWrites.mockResolvedValue([])

    const prepared = await run('image-1')

    expect(prepared.writes).toEqual(['image-1@0', 'image-0@1', 'image-2@2'])
  })
})
