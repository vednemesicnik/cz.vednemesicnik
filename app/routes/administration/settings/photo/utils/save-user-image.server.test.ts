import { beforeEach, describe, expect, test, vi } from 'vitest'

import { saveUserImage } from './save-user-image.server'

const mocks = vi.hoisted(() => ({
  createId: vi.fn(),
  deleteImage: vi.fn(),
  deleteImageVersion: vi.fn(),
  storeImageVariants: vi.fn(),
  userImageDeleteMany: vi.fn(),
  userImageFindUnique: vi.fn(),
  userImageUpdateMany: vi.fn(),
  userImageUpsert: vi.fn(),
}))

vi.mock('@paralleldrive/cuid2', () => ({ createId: mocks.createId }))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    userImage: {
      deleteMany: mocks.userImageDeleteMany,
      findUnique: mocks.userImageFindUnique,
      updateMany: mocks.userImageUpdateMany,
      upsert: mocks.userImageUpsert,
    },
  },
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteImage: mocks.deleteImage,
  deleteImageVersion: mocks.deleteImageVersion,
  storeImageVariants: mocks.storeImageVariants,
}))

const file = new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })

const newMeta = {
  intrinsicHeight: 600,
  intrinsicWidth: 600,
  placeholderDataUrl: 'data:image/jpeg;base64,BBBB',
  version: 'v2',
}

const previousMeta = {
  intrinsicHeight: 400,
  intrinsicWidth: 400,
  placeholderDataUrl: 'data:image/jpeg;base64,AAAA',
  version: 'v1',
}

const existingPhoto = { id: 'image-1', ...previousMeta }

let controller: AbortController

const save = () =>
  saveUserImage(
    new Request('https://test.local/', { signal: controller.signal }),
    {
      file,
      userId: 'user-1',
    },
  )

beforeEach(() => {
  vi.clearAllMocks()
  controller = new AbortController()
  mocks.createId.mockReturnValue('image-new')
  mocks.storeImageVariants.mockResolvedValue(newMeta)
  mocks.userImageUpsert.mockResolvedValue({})
  mocks.userImageDeleteMany.mockResolvedValue({ count: 1 })
  mocks.userImageUpdateMany.mockResolvedValue({ count: 1 })
})

describe('saveUserImage — a save', () => {
  test('a first photo is stored under a new id and saved', async () => {
    mocks.userImageFindUnique.mockResolvedValue(null)

    await expect(save()).resolves.toEqual({ status: 'saved' })
    expect(mocks.storeImageVariants).toHaveBeenCalledWith('image-new', file)
    expect(mocks.userImageUpsert).toHaveBeenCalledWith({
      create: { id: 'image-new', userId: 'user-1', ...newMeta },
      update: newMeta,
      where: { userId: 'user-1' },
    })
    expect(mocks.deleteImageVersion).not.toHaveBeenCalled()
  })

  test('a replacement drops the previous version after the commit', async () => {
    mocks.userImageFindUnique.mockResolvedValue(existingPhoto)

    await expect(save()).resolves.toEqual({ status: 'saved' })
    expect(mocks.storeImageVariants).toHaveBeenCalledWith('image-1', file)
    expect(mocks.deleteImageVersion).toHaveBeenCalledWith('image-1', 'v1')
  })

  test('a file that cannot be processed fails and leaves no files', async () => {
    mocks.userImageFindUnique.mockResolvedValue(null)
    mocks.storeImageVariants.mockRejectedValue(new Error('sharp'))

    await expect(save()).resolves.toEqual({ status: 'failed' })
    expect(mocks.deleteImage).toHaveBeenCalledWith('image-new')
    expect(mocks.userImageUpsert).not.toHaveBeenCalled()
  })

  test('a failed replacement keeps the previous version', async () => {
    mocks.userImageFindUnique.mockResolvedValue(existingPhoto)
    mocks.storeImageVariants.mockRejectedValue(new Error('sharp'))

    await expect(save()).resolves.toEqual({ status: 'failed' })
    expect(mocks.deleteImage).not.toHaveBeenCalled()
    expect(mocks.deleteImageVersion).not.toHaveBeenCalled()
  })
})

describe('saveUserImage — a cancel (log 0029)', () => {
  test('before any file is stored, nothing happens', async () => {
    controller.abort()

    await expect(save()).resolves.toEqual({ status: 'cancelled' })
    expect(mocks.userImageFindUnique).not.toHaveBeenCalled()
    expect(mocks.storeImageVariants).not.toHaveBeenCalled()
  })

  test('while the files are stored, a first photo’s files go and nothing commits', async () => {
    mocks.userImageFindUnique.mockResolvedValue(null)
    mocks.storeImageVariants.mockImplementation(async () => {
      controller.abort()
      return newMeta
    })

    await expect(save()).resolves.toEqual({ status: 'cancelled' })
    expect(mocks.deleteImage).toHaveBeenCalledWith('image-new')
    expect(mocks.userImageUpsert).not.toHaveBeenCalled()
  })

  test('while the files are stored, a replacement drops only the new version', async () => {
    mocks.userImageFindUnique.mockResolvedValue(existingPhoto)
    mocks.storeImageVariants.mockImplementation(async () => {
      controller.abort()
      return newMeta
    })

    await expect(save()).resolves.toEqual({ status: 'cancelled' })
    expect(mocks.deleteImageVersion).toHaveBeenCalledWith('image-1', 'v2')
    expect(mocks.deleteImage).not.toHaveBeenCalled()
    expect(mocks.userImageUpsert).not.toHaveBeenCalled()
  })

  test('during the commit, a first photo is deleted again', async () => {
    mocks.userImageFindUnique.mockResolvedValue(null)
    mocks.userImageUpsert.mockImplementation(async () => {
      controller.abort()
      return {}
    })

    await expect(save()).resolves.toEqual({ status: 'cancelled' })
    expect(mocks.userImageDeleteMany).toHaveBeenCalledWith({
      where: { id: 'image-new', version: 'v2' },
    })
    expect(mocks.deleteImage).toHaveBeenCalledWith('image-new')
  })

  test('during the commit, a replacement points back at the previous version', async () => {
    mocks.userImageFindUnique.mockResolvedValue(existingPhoto)
    mocks.userImageUpsert.mockImplementation(async () => {
      controller.abort()
      return {}
    })

    await expect(save()).resolves.toEqual({ status: 'cancelled' })
    expect(mocks.userImageUpdateMany).toHaveBeenCalledWith({
      data: previousMeta,
      where: { userId: 'user-1', version: 'v2' },
    })
    expect(mocks.deleteImageVersion).toHaveBeenCalledTimes(1)
    expect(mocks.deleteImageVersion).toHaveBeenCalledWith('image-1', 'v2')
  })

  test('during the commit, a later save from elsewhere stays', async () => {
    mocks.userImageFindUnique.mockResolvedValue(existingPhoto)
    mocks.userImageUpsert.mockImplementation(async () => {
      controller.abort()
      return {}
    })
    mocks.userImageUpdateMany.mockResolvedValue({ count: 0 })

    await expect(save()).resolves.toEqual({ status: 'cancelled' })
    expect(mocks.deleteImageVersion).not.toHaveBeenCalled()
  })
})
