import { beforeEach, describe, expect, test, vi } from 'vitest'

import { action } from './_action'

const mocks = vi.hoisted(() => ({
  removeArticleImage: vi.fn(),
  reorderArticleImages: vi.fn(),
  requireCSRF: vi.fn(),
  setArticleFeaturedImage: vi.fn(),
  uploadArticleImage: vi.fn(),
}))

vi.mock('~/utils/csrf.server', () => ({ requireCSRF: mocks.requireCSRF }))

vi.mock('./utils/remove-article-image.server', () => ({
  removeArticleImage: mocks.removeArticleImage,
}))

vi.mock('./utils/reorder-article-images.server', () => ({
  reorderArticleImages: mocks.reorderArticleImages,
}))

vi.mock('./utils/set-article-featured-image.server', () => ({
  setArticleFeaturedImage: mocks.setArticleFeaturedImage,
}))

vi.mock('./utils/upload-article-image.server', () => ({
  uploadArticleImage: mocks.uploadArticleImage,
}))

const buildRequest = (fields: Array<[string, string | File]>) => {
  const formData = new FormData()
  for (const [name, value] of fields) {
    formData.append(name, value)
  }
  return new Request(
    'https://test.local/administration/articles/a/article-images',
    { body: formData, method: 'POST' },
  )
}

const callAction = (request: Request) =>
  action({
    context: {},
    params: { articleId: 'article-1' },
    request,
  } as unknown as Parameters<typeof action>[0])

const target = { articleId: 'article-1', tabId: 'tab-1' }

beforeEach(() => {
  vi.clearAllMocks()
  const saved = { status: 'saved', updatedAt: new Date('2026-10-16T12:00:00Z') }
  mocks.uploadArticleImage.mockResolvedValue({
    ...saved,
    fileName: 'photo.jpg',
    previewUrl: '/preview.jpg',
  })
  mocks.removeArticleImage.mockResolvedValue(saved)
  mocks.setArticleFeaturedImage.mockResolvedValue(saved)
  mocks.reorderArticleImages.mockResolvedValue(saved)
})

describe('article-images action — the input', () => {
  test('requires the session', async () => {
    await callAction(
      buildRequest([
        ['intent', 'remove'],
        ['imageId', 'image-1'],
        ['editTabId', 'tab-1'],
      ]),
    )

    expect(mocks.requireCSRF).toHaveBeenCalledOnce()
  })

  test('runs no change when the session is refused', async () => {
    mocks.requireCSRF.mockRejectedValueOnce(new Response(null, { status: 403 }))

    await expect(
      callAction(
        buildRequest([
          ['intent', 'remove'],
          ['imageId', 'image-1'],
          ['editTabId', 'tab-1'],
        ]),
      ),
    ).rejects.toBeInstanceOf(Response)

    expect(mocks.removeArticleImage).not.toHaveBeenCalled()
  })

  test.each([
    [
      'an unknown intent',
      [
        ['intent', 'explode'],
        ['editTabId', 'tab-1'],
      ],
    ],
    ['a missing intent', [['editTabId', 'tab-1']]],
    [
      'a missing editor tab',
      [
        ['intent', 'remove'],
        ['imageId', 'image-1'],
      ],
    ],
    [
      'a removal without an image',
      [
        ['intent', 'remove'],
        ['editTabId', 'tab-1'],
      ],
    ],
    [
      'a reorder without ids',
      [
        ['intent', 'reorder'],
        ['editTabId', 'tab-1'],
      ],
    ],
    [
      'an upload without a file',
      [
        ['intent', 'upload'],
        ['imageId', 'image-1'],
        ['editTabId', 'tab-1'],
      ],
    ],
  ] as Array<[string, Array<[string, string]>]>)(
    'answers 400 invalid for %s',
    async (_name, fields) => {
      const response = await callAction(buildRequest(fields))

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ status: 'invalid' })
      for (const operation of [
        mocks.uploadArticleImage,
        mocks.removeArticleImage,
        mocks.setArticleFeaturedImage,
        mocks.reorderArticleImages,
      ]) {
        expect(operation).not.toHaveBeenCalled()
      }
    },
  )
})

describe('article-images action — the dispatch', () => {
  test('uploads with the file, the id, the alt text and the caption', async () => {
    const file = new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })

    const response = await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['imageId', 'image-1'],
        ['editTabId', 'tab-1'],
        ['altText', '  Alt  '],
        ['description', ' Caption '],
        ['file', file],
      ]),
    )

    expect(mocks.uploadArticleImage).toHaveBeenCalledWith(expect.any(Request), {
      ...target,
      altText: 'Alt',
      description: 'Caption',
      file: expect.any(File),
      imageId: 'image-1',
    })
    expect(mocks.uploadArticleImage.mock.lastCall?.[1].file.name).toBe(
      'photo.jpg',
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      fileName: 'photo.jpg',
      previewUrl: '/preview.jpg',
      status: 'saved',
      updatedAt: '2026-10-16T12:00:00.000Z',
    })
  })

  test('uploads with an empty alt text and caption when none is sent', async () => {
    await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['imageId', 'image-1'],
        ['editTabId', 'tab-1'],
        ['file', new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })],
      ]),
    )

    expect(mocks.uploadArticleImage.mock.lastCall?.[1]).toMatchObject({
      altText: '',
      description: '',
    })
  })

  test('removes an image', async () => {
    const response = await callAction(
      buildRequest([
        ['intent', 'remove'],
        ['imageId', 'image-1'],
        ['editTabId', 'tab-1'],
      ]),
    )

    expect(mocks.removeArticleImage).toHaveBeenCalledWith(expect.any(Request), {
      ...target,
      imageId: 'image-1',
    })
    expect(response.status).toBe(200)
  })

  test('sets the main image', async () => {
    await callAction(
      buildRequest([
        ['intent', 'feature'],
        ['imageId', 'image-1'],
        ['editTabId', 'tab-1'],
      ]),
    )

    expect(mocks.setArticleFeaturedImage).toHaveBeenCalledWith(
      expect.any(Request),
      { ...target, imageId: 'image-1' },
    )
  })

  test('clears the main image when no image is sent', async () => {
    await callAction(
      buildRequest([
        ['intent', 'feature'],
        ['editTabId', 'tab-1'],
      ]),
    )

    expect(mocks.setArticleFeaturedImage).toHaveBeenCalledWith(
      expect.any(Request),
      { ...target, imageId: null },
    )
  })

  test('reorders by the repeated imageIds fields, in order', async () => {
    await callAction(
      buildRequest([
        ['intent', 'reorder'],
        ['editTabId', 'tab-1'],
        ['imageIds', 'c'],
        ['imageIds', 'a'],
        ['imageIds', 'b'],
      ]),
    )

    expect(mocks.reorderArticleImages).toHaveBeenCalledWith(
      expect.any(Request),
      { ...target, imageIds: ['c', 'a', 'b'] },
    )
  })
})

describe('article-images action — the status codes', () => {
  const removeFields: Array<[string, string]> = [
    ['intent', 'remove'],
    ['imageId', 'image-1'],
    ['editTabId', 'tab-1'],
  ]

  test('answers 409 with the holder when the tab does not hold it', async () => {
    mocks.removeArticleImage.mockResolvedValue({
      heldByName: 'Jakub Novák',
      status: 'not-held',
    })

    const response = await callAction(buildRequest(removeFields))

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      heldByName: 'Jakub Novák',
      status: 'not-held',
    })
  })

  test('answers 422 for a file that could not be processed', async () => {
    mocks.uploadArticleImage.mockResolvedValue({ status: 'failed' })

    const response = await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['imageId', 'image-1'],
        ['editTabId', 'tab-1'],
        ['file', new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })],
      ]),
    )

    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({ status: 'failed' })
  })

  test('answers 499 for an upload the editor cancelled', async () => {
    mocks.uploadArticleImage.mockResolvedValue({ status: 'cancelled' })

    const response = await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['imageId', 'image-1'],
        ['editTabId', 'tab-1'],
        ['file', new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })],
      ]),
    )

    expect(response.status).toBe(499)
  })
})

describe('article-images action — a cancelled body (bxy8xxqs)', () => {
  const buildAbortedRequest = () => {
    const controller = new AbortController()
    const body = new ReadableStream({
      start: (streamController) => streamController.error(new Error('gone')),
    })
    const request = new Request(
      'https://test.local/administration/articles/a/article-images',
      {
        body,
        duplex: 'half',
        headers: { 'Content-Type': 'multipart/form-data; boundary=boundary' },
        method: 'POST',
        signal: controller.signal,
      } as RequestInit,
    )
    controller.abort()
    return request
  }

  test('answers 499 and runs nothing when the editor cancelled mid-body', async () => {
    const response = await callAction(buildAbortedRequest())

    expect(response.status).toBe(499)
    expect(mocks.requireCSRF).not.toHaveBeenCalled()
    expect(mocks.uploadArticleImage).not.toHaveBeenCalled()
  })

  test('lets a body that broke for another reason through', async () => {
    const body = new ReadableStream({
      start: (streamController) => streamController.error(new Error('broke')),
    })
    const request = new Request(
      'https://test.local/administration/articles/a/article-images',
      {
        body,
        duplex: 'half',
        headers: { 'Content-Type': 'multipart/form-data; boundary=boundary' },
        method: 'POST',
      } as RequestInit,
    )

    await expect(callAction(request)).rejects.toThrow()
  })
})
