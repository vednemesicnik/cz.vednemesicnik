import { beforeEach, describe, expect, test, vi } from 'vitest'

import { PODCAST_COVER_CONFIG } from '~/config/podcast-cover-config'

import type { CoverChangeEpisode } from './save-episode-cover-change.server'
import { uploadEpisodeCover } from './upload-episode-cover.server'

const mocks = vi.hoisted(() => ({
  coverCreate: vi.fn(),
  coverDelete: vi.fn(),
  coverFindUnique: vi.fn(),
  coverUpdate: vi.fn(),
  createId: vi.fn(),
  deleteImage: vi.fn(),
  deleteImageVersion: vi.fn(),
  isImageOverPixelBudget: vi.fn(),
  saveEpisodeCoverChange: vi.fn(),
  storeImageVariants: vi.fn(),
}))

vi.mock('@paralleldrive/cuid2', () => ({ createId: mocks.createId }))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    podcastEpisodeCover: {
      create: mocks.coverCreate,
      delete: mocks.coverDelete,
      findUnique: mocks.coverFindUnique,
      update: mocks.coverUpdate,
    },
  },
}))

vi.mock('~/utils/image-store/is-image-over-pixel-budget.server', () => ({
  isImageOverPixelBudget: mocks.isImageOverPixelBudget,
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteImage: mocks.deleteImage,
  deleteImageVersion: mocks.deleteImageVersion,
  storeImageVariants: mocks.storeImageVariants,
}))

vi.mock('./save-episode-cover-change.server', () => ({
  saveEpisodeCoverChange: mocks.saveEpisodeCoverChange,
}))

const request = new Request('https://test.local/')

const episode: CoverChangeEpisode = {
  cover: null,
  number: 14,
  state: 'draft',
  title: 'Školník, který ví všechno',
}

const meta = {
  intrinsicHeight: 1400,
  intrinsicWidth: 1400,
  placeholderDataUrl: 'data:image/jpeg;base64,AAAA',
  version: 'v2',
}

const target = {
  episodeId: 'episode-1',
  podcastId: 'podcast-1',
  tabId: 'tab-1',
}

const run = async (stored: Partial<CoverChangeEpisode> = {}) => {
  await uploadEpisodeCover(request, {
    ...target,
    file: new File(['bytes'], 'obalka.jpg', { type: 'image/jpeg' }),
  })
  const { prepare } = mocks.saveEpisodeCoverChange.mock.lastCall?.[1] ?? {}
  return prepare({ ...episode, ...stored })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.createId.mockReturnValue('cover-new')
  mocks.saveEpisodeCoverChange.mockResolvedValue({ status: 'saved' })
  mocks.isImageOverPixelBudget.mockResolvedValue(false)
  mocks.storeImageVariants.mockResolvedValue(meta)
  mocks.deleteImage.mockResolvedValue(undefined)
  mocks.deleteImageVersion.mockResolvedValue(undefined)
  mocks.coverCreate.mockReturnValue('create-cover')
  mocks.coverUpdate.mockReturnValue('update-cover')
  mocks.coverFindUnique.mockResolvedValue({
    id: 'cover-1',
    intrinsicHeight: 1000,
    intrinsicWidth: 1000,
    placeholderDataUrl: 'data:image/jpeg;base64,BBBB',
    version: 'v1',
  })
})

describe('uploadEpisodeCover — the input', () => {
  test.each([
    ['an empty file', new File([], 'empty.jpg', { type: 'image/jpeg' })],
    [
      'a file over 5 MB',
      new File(
        [new Uint8Array(PODCAST_COVER_CONFIG.maxFileBytes + 1)],
        'big.jpg',
        { type: 'image/jpeg' },
      ),
    ],
    [
      'a file that is not an image',
      new File(['%PDF'], 'obalka.pdf', { type: 'application/pdf' }),
    ],
  ])('answers 400 for %s', async (_name, file) => {
    await expect(
      uploadEpisodeCover(request, { ...target, file }),
    ).rejects.toMatchObject({ init: { status: 400 } })

    expect(mocks.saveEpisodeCoverChange).not.toHaveBeenCalled()
  })

  test('lands without the hold, never over someone else’s', async () => {
    await run()

    expect(mocks.saveEpisodeCoverChange).toHaveBeenCalledWith(
      request,
      expect.objectContaining({ ...target, landsWithoutHold: true }),
    )
  })

  test('can be cancelled until it saves (bxy8xxqs)', async () => {
    await run()

    expect(mocks.saveEpisodeCoverChange).toHaveBeenCalledWith(
      request,
      expect.objectContaining({ isCancellable: true }),
    )
  })

  test('refuses an image over the pixel budget before storing it', async () => {
    mocks.isImageOverPixelBudget.mockResolvedValue(true)

    expect(await run()).toEqual({
      reason: 'over-pixel-budget',
      status: 'failed',
    })
    expect(mocks.storeImageVariants).not.toHaveBeenCalled()
  })
})

describe('uploadEpisodeCover — a new cover', () => {
  test('stores the variants, then creates the row with the composed alt text', async () => {
    const prepared = await run()

    expect(mocks.storeImageVariants).toHaveBeenCalledWith(
      'cover-new',
      expect.any(File),
    )
    expect(mocks.coverCreate).toHaveBeenCalledWith({
      data: {
        ...meta,
        altText: 'Obálka epizody 14: Školník, který ví všechno',
        episodeId: 'episode-1',
        id: 'cover-new',
      },
      select: { id: true },
    })
    expect(prepared).toMatchObject({
      addsContent: true,
      isUpload: true,
      writes: ['create-cover'],
    })
  })

  test('a refused write drops the stored variants', async () => {
    const prepared = await run()

    await prepared.onRefused()

    expect(mocks.deleteImage).toHaveBeenCalledWith('cover-new')
  })

  test('a failed store drops what made it and fails', async () => {
    mocks.storeImageVariants.mockRejectedValue(new Error('sharp'))

    expect(await run()).toEqual({ status: 'failed' })
    expect(mocks.deleteImage).toHaveBeenCalledWith('cover-new')
  })

  test('a cancel after the commit deletes the row and its files', async () => {
    const prepared = await run()

    await prepared.onCancelled()

    expect(mocks.coverDelete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: 'cover-new' },
    })
    expect(mocks.deleteImage).toHaveBeenCalledWith('cover-new')
  })
})

describe('uploadEpisodeCover — a replacement', () => {
  test('keeps the id, writes the new version and drops the old one once saved', async () => {
    const prepared = await run({ cover: { id: 'cover-1' } })

    expect(mocks.storeImageVariants).toHaveBeenCalledWith(
      'cover-1',
      expect.any(File),
    )
    expect(mocks.coverUpdate).toHaveBeenCalledWith({
      data: meta,
      select: { id: true },
      where: { id: 'cover-1' },
    })
    expect(prepared).toMatchObject({ isUpload: true, writes: ['update-cover'] })
    expect(prepared.addsContent).toBeUndefined()

    await prepared.onCommitted()
    expect(mocks.deleteImageVersion).toHaveBeenCalledWith('cover-1', 'v1')
  })

  test('a refused write keeps the old cover and drops the new version', async () => {
    const prepared = await run({ cover: { id: 'cover-1' } })

    await prepared.onRefused()

    expect(mocks.deleteImageVersion).toHaveBeenCalledWith('cover-1', 'v2')
    expect(mocks.deleteImage).not.toHaveBeenCalled()
  })

  test('a failed store keeps the old cover', async () => {
    mocks.storeImageVariants.mockRejectedValue(new Error('sharp'))

    expect(await run({ cover: { id: 'cover-1' } })).toEqual({
      status: 'failed',
    })
    expect(mocks.deleteImage).not.toHaveBeenCalled()
  })

  test('a cancel after the commit puts the previous version back and drops the new one', async () => {
    const prepared = await run({ cover: { id: 'cover-1' } })

    await prepared.onCancelled()

    expect(mocks.coverUpdate).toHaveBeenLastCalledWith({
      data: {
        intrinsicHeight: 1000,
        intrinsicWidth: 1000,
        placeholderDataUrl: 'data:image/jpeg;base64,BBBB',
        version: 'v1',
      },
      select: { id: true },
      where: { id: 'cover-1' },
    })
    expect(mocks.deleteImageVersion).toHaveBeenCalledWith('cover-1', 'v2')
    expect(mocks.deleteImageVersion).not.toHaveBeenCalledWith('cover-1', 'v1')
  })
})
