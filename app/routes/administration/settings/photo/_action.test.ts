import { beforeEach, describe, expect, test, vi } from 'vitest'

import { action } from './_action'
import { MAX_PROFILE_IMAGE_SIZE } from './_schema'

const mocks = vi.hoisted(() => ({
  checkUserPermission: vi.fn(),
  deleteUserImage: vi.fn(),
  getUserPermissionContext: vi.fn(),
  requireAuthentication: vi.fn(),
  requireCSRF: vi.fn(),
  saveUserImage: vi.fn(),
}))

vi.mock('~/utils/auth.server', () => ({
  requireAuthentication: mocks.requireAuthentication,
}))

vi.mock('~/utils/csrf.server', () => ({ requireCSRF: mocks.requireCSRF }))

vi.mock(
  '~/utils/permissions/user/context/get-user-permission-context.server',
  () => ({ getUserPermissionContext: mocks.getUserPermissionContext }),
)

vi.mock('~/utils/permissions/user/guards/check-user-permission.server', () => ({
  checkUserPermission: mocks.checkUserPermission,
}))

vi.mock('./utils/delete-user-image.server', () => ({
  deleteUserImage: mocks.deleteUserImage,
}))

vi.mock('./utils/save-user-image.server', () => ({
  saveUserImage: mocks.saveUserImage,
}))

const PHOTO_URL = 'https://test.local/administration/settings/photo'

const buildRequest = (fields: Array<[string, string | File]>) => {
  const formData = new FormData()
  for (const [name, value] of fields) {
    formData.append(name, value)
  }
  return new Request(PHOTO_URL, { body: formData, method: 'POST' })
}

const callAction = (request: Request) =>
  action({
    context: {},
    params: {},
    request,
    url: new URL(request.url),
  } as unknown as Parameters<typeof action>[0])

const photo = new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireAuthentication.mockResolvedValue({ userId: 'user-1' })
  mocks.getUserPermissionContext.mockResolvedValue({ userId: 'user-1' })
  mocks.saveUserImage.mockResolvedValue({ status: 'saved' })
})

describe('photo action — the dispatch', () => {
  test('an upload saves the photo of the signed-in user', async () => {
    const request = buildRequest([
      ['intent', 'upload'],
      ['image', photo],
    ])
    const response = await callAction(request)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'saved' })
    expect(mocks.requireCSRF).toHaveBeenCalled()
    expect(mocks.checkUserPermission).toHaveBeenCalledWith(
      { userId: 'user-1' },
      { action: 'update', entity: 'author', targetUserId: 'user-1' },
    )
    expect(mocks.saveUserImage).toHaveBeenCalledWith(request, {
      file: expect.any(File),
      userId: 'user-1',
    })
  })

  test('a removal removes the photo of the signed-in user', async () => {
    const response = await callAction(buildRequest([['intent', 'remove']]))

    await expect(response.json()).resolves.toEqual({ status: 'removed' })
    expect(mocks.deleteUserImage).toHaveBeenCalledWith('user-1')
    expect(mocks.saveUserImage).not.toHaveBeenCalled()
  })
})

describe('photo action — the input', () => {
  test('a file that is not an image is refused', async () => {
    const text = new File(['text'], 'notes.txt', { type: 'text/plain' })
    const response = await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['image', text],
      ]),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      imageError: 'Vyberte obrázek — tento soubor není obrázek.',
      status: 'invalid',
    })
    expect(mocks.saveUserImage).not.toHaveBeenCalled()
  })

  test('a photo over 5 MB is refused', async () => {
    const large = new File(
      [new Uint8Array(MAX_PROFILE_IMAGE_SIZE + 1)],
      'big.jpg',
      {
        type: 'image/jpeg',
      },
    )
    const response = await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['image', large],
      ]),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      imageError: 'Vyberte obrázek do 5 MB — tento je příliš velký.',
      status: 'invalid',
    })
  })

  test('an unknown intent is refused', async () => {
    const response = await callAction(buildRequest([['intent', 'rename']]))

    expect(response.status).toBe(400)
  })
})

describe('photo action — the status codes', () => {
  test('a photo that could not be processed answers 422 with the sentence', async () => {
    mocks.saveUserImage.mockResolvedValue({ status: 'failed' })
    const response = await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['image', photo],
      ]),
    )

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({
      imageError: 'Zkuste fotku nahrát znovu — nahrání se nezdařilo.',
      status: 'failed',
    })
  })

  test('a row that could not be written fails the same way', async () => {
    mocks.saveUserImage.mockRejectedValue(new Error('database'))
    const response = await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['image', photo],
      ]),
    )

    expect(response.status).toBe(422)
  })

  test('a cancelled upload answers 499', async () => {
    mocks.saveUserImage.mockResolvedValue({ status: 'cancelled' })
    const response = await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['image', photo],
      ]),
    )

    expect(response.status).toBe(499)
  })
})

describe('photo action — a cancelled body (decision 0029)', () => {
  const buildBrokenRequest = (signal?: AbortSignal) =>
    new Request(PHOTO_URL, {
      body: new ReadableStream({
        start: (streamController) => streamController.error(new Error('gone')),
      }),
      duplex: 'half',
      headers: { 'Content-Type': 'multipart/form-data; boundary=boundary' },
      method: 'POST',
      signal,
    } as RequestInit)

  test('answers 499 and runs nothing when the person cancelled mid-body', async () => {
    const controller = new AbortController()
    const request = buildBrokenRequest(controller.signal)
    controller.abort()

    const response = await callAction(request)

    expect(response.status).toBe(499)
    expect(mocks.requireCSRF).not.toHaveBeenCalled()
    expect(mocks.saveUserImage).not.toHaveBeenCalled()
  })

  test('a body that broke for another reason reads as a too-large photo', async () => {
    const response = await callAction(buildBrokenRequest())

    expect(response.status).toBe(413)
    await expect(response.json()).resolves.toEqual({
      imageError: 'Vyberte obrázek do 5 MB — tento je příliš velký.',
      status: 'invalid',
    })
  })
})
