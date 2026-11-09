import { beforeEach, describe, expect, test, vi } from 'vitest'

import { setArticleFeaturedImage } from './set-article-featured-image.server'

const mocks = vi.hoisted(() => ({
  articleImageFindMany: vi.fn(),
  articleImageUpdate: vi.fn(),
  ensureArticleOgImage: vi.fn(),
  saveArticleImageChange: vi.fn(),
}))

vi.mock(
  '~/routes/administration/articles/utils/ensure-article-og-image.server',
  () => ({ ensureArticleOgImage: mocks.ensureArticleOgImage }),
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
const article = { featuredImageId: null }

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
    expect(mocks.ensureArticleOgImage).not.toHaveBeenCalled()
  })

  test('sets the main image first and makes its share crop', async () => {
    const prepared = await run('image-1')

    // The others keep their order behind it (yj2t50dd).
    expect(prepared).toEqual({
      answer: {},
      articleData: { featuredImageId: 'image-1' },
      writes: ['image-1@0', 'image-0@1', 'image-2@2'],
    })
    expect(mocks.ensureArticleOgImage).toHaveBeenCalledWith('image-1')
  })

  test('clears the main image and leaves it first, as the editor shows it', async () => {
    const prepared = await setArticleFeaturedImage(request, {
      articleId: 'article-1',
      imageId: null,
      tabId: 'tab-1',
    }).then(() =>
      mocks.saveArticleImageChange.mock.lastCall?.[1].prepare(context, {
        featuredImageId: 'image-2',
      }),
    )

    expect(prepared.articleData).toEqual({ featuredImageId: null })
    expect(prepared.writes).toEqual(['image-2@0', 'image-0@1', 'image-1@2'])
  })

  test('clears no main image without touching the order', async () => {
    const prepared = await run(null)

    expect(mocks.articleImageFindMany).not.toHaveBeenCalled()
    expect(prepared.writes).toEqual([])
  })
})
