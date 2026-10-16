import { beforeEach, describe, expect, test, vi } from 'vitest'

import { reorderArticleImages } from './reorder-article-images.server'

const mocks = vi.hoisted(() => ({
  articleImageFindMany: vi.fn(),
  articleImageUpdate: vi.fn(),
  saveArticleImageChange: vi.fn(),
}))

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

const run = async (imageIds: string[]) => {
  await reorderArticleImages(request, {
    articleId: 'article-1',
    imageIds,
    tabId: 'tab-1',
  })
  const { prepare } = mocks.saveArticleImageChange.mock.lastCall?.[1] ?? {}
  return prepare()
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.saveArticleImageChange.mockResolvedValue({ status: 'saved' })
  mocks.articleImageFindMany.mockResolvedValue([
    { id: 'a' },
    { id: 'b' },
    { id: 'c' },
  ])
  mocks.articleImageUpdate.mockImplementation(
    ({ data: { position }, where: { id } }) => `${id}@${position}`,
  )
})

describe('reorderArticleImages', () => {
  test('saves for the article and the tab', async () => {
    await run(['a', 'b', 'c'])

    expect(mocks.saveArticleImageChange).toHaveBeenCalledWith(request, {
      articleId: 'article-1',
      prepare: expect.any(Function),
      tabId: 'tab-1',
    })
    expect(mocks.articleImageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { articleId: 'article-1' } }),
    )
  })

  test('gives each image its index as the position', async () => {
    const prepared = await run(['c', 'a', 'b'])

    expect(prepared.writes).toEqual(['c@0', 'a@1', 'b@2'])
    expect(prepared.answer).toEqual({})
  })

  test('appends images the list leaves out after the listed ones', async () => {
    const prepared = await run(['c'])

    expect(prepared.writes).toEqual(['c@0', 'a@1', 'b@2'])
  })

  test('answers 400 for a repeated id', async () => {
    await expect(run(['a', 'a'])).rejects.toMatchObject({
      init: { status: 400 },
    })
    expect(mocks.articleImageUpdate).not.toHaveBeenCalled()
  })

  test('answers 400 for an id that is not the article’s', async () => {
    await expect(run(['a', 'foreign'])).rejects.toMatchObject({
      init: { status: 400 },
    })
    expect(mocks.articleImageUpdate).not.toHaveBeenCalled()
  })

  test('returns what the change returns', async () => {
    mocks.saveArticleImageChange.mockResolvedValue({
      heldByName: null,
      status: 'not-held',
    })

    await expect(
      reorderArticleImages(request, {
        articleId: 'article-1',
        imageIds: ['a'],
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ heldByName: null, status: 'not-held' })
  })
})
