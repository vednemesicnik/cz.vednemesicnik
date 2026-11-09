import { beforeEach, describe, expect, test, vi } from 'vitest'

import { removeArticleImage } from './remove-article-image.server'

const mocks = vi.hoisted(() => ({
  articleImageDelete: vi.fn(),
  articleImageFindUnique: vi.fn(),
  deleteImage: vi.fn(),
  saveArticleImageChange: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    articleImage: {
      delete: mocks.articleImageDelete,
      findUnique: mocks.articleImageFindUnique,
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
  article: { featuredImageId: string | null } = { featuredImageId: null },
) => {
  await removeArticleImage(request, options)
  const { prepare } = mocks.saveArticleImageChange.mock.lastCall?.[1] ?? {}
  return prepare(context, article)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.saveArticleImageChange.mockResolvedValue({ status: 'saved' })
  mocks.articleImageFindUnique.mockResolvedValue({ articleId: 'article-1' })
  mocks.articleImageDelete.mockReturnValue('delete-image')
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

  test('answers 400 for an image of another article', async () => {
    mocks.articleImageFindUnique.mockResolvedValue({ articleId: 'article-2' })

    await expect(run()).rejects.toMatchObject({ init: { status: 400 } })

    expect(mocks.articleImageFindUnique).toHaveBeenCalledWith({
      select: { articleId: true },
      where: { id: 'image-1' },
    })
    expect(mocks.articleImageDelete).not.toHaveBeenCalled()
  })

  test('an image that does not exist counts as removed', async () => {
    mocks.articleImageFindUnique.mockResolvedValue(null)

    const prepared = await run()

    expect(prepared.writes).toEqual([])
    expect(mocks.articleImageDelete).not.toHaveBeenCalled()
    expect(mocks.deleteImage).not.toHaveBeenCalled()
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

  test('removing the main image writes only its delete', async () => {
    const prepared = await run({ featuredImageId: 'image-1' })

    expect(prepared.writes).toEqual(['delete-image'])
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
