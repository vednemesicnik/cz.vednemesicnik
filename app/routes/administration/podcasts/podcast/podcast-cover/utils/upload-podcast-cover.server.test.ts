import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { PODCAST_COVER_CONFIG } from '~/config/podcast-cover-config'

import { uploadPodcastCover } from './upload-podcast-cover.server'

const mocks = vi.hoisted(() => ({
  coverCreate: vi.fn(),
  coverDelete: vi.fn(),
  coverFindUnique: vi.fn(),
  coverUpdate: vi.fn(),
  createId: vi.fn(),
  deleteImage: vi.fn(),
  deleteImageVersion: vi.fn(),
  isImageOverPixelBudget: vi.fn(),
  permissionContext: vi.fn(),
  podcastFindUnique: vi.fn(),
  podcastFindUniqueOrThrow: vi.fn(),
  podcastUpdate: vi.fn(),
  podcastUpdateMany: vi.fn(),
  publishContentEvent: vi.fn(),
  recordContentLog: vi.fn(),
  recordEditLog: vi.fn(),
  storeImageVariants: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('@paralleldrive/cuid2', () => ({ createId: mocks.createId }))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    $transaction: mocks.transaction,
    podcast: {
      findUnique: mocks.podcastFindUnique,
      findUniqueOrThrow: mocks.podcastFindUniqueOrThrow,
      update: mocks.podcastUpdate,
      updateMany: mocks.podcastUpdateMany,
    },
    podcastCover: {
      create: mocks.coverCreate,
      delete: mocks.coverDelete,
      findUnique: mocks.coverFindUnique,
      update: mocks.coverUpdate,
    },
  },
}))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({
    withAuthorPermission: (
      _request: Request,
      options: { execute: (context: unknown) => Promise<unknown> },
    ) => options.execute(mocks.permissionContext()),
  }),
)

vi.mock('~/utils/image-store/is-image-over-pixel-budget.server', () => ({
  isImageOverPixelBudget: mocks.isImageOverPixelBudget,
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteImage: mocks.deleteImage,
  deleteImageVersion: mocks.deleteImageVersion,
  storeImageVariants: mocks.storeImageVariants,
}))

vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: mocks.recordContentLog,
}))

vi.mock('~/utils/content-log/record-edit-log.server', () => ({
  recordEditLog: mocks.recordEditLog,
}))

vi.mock('~/utils/sse/publish-content-event.server', () => ({
  publishContentEvent: mocks.publishContentEvent,
}))

const request = new Request('https://test.local/')
const image = () => new File(['bytes'], 'obalka.jpg', { type: 'image/jpeg' })
const target = { podcastId: 'podcast-1', tabId: 'tab-1' }

const meta = {
  intrinsicHeight: 3000,
  intrinsicWidth: 3000,
  placeholderDataUrl: 'data:image/jpeg;base64,AAAA',
  version: 'v2',
}

// The podcast as this tab holds it: a draft with content, without a cover.
const heldPodcast = {
  authorId: 'author-1',
  cover: null,
  firstContentAt: new Date('2026-10-28T08:00:00Z'),
  heldByAuthor: { name: 'Anna Dvořáková' },
  heldByAuthorId: 'author-1',
  heldByTabId: 'tab-1',
  heldSince: new Date('2026-10-28T08:00:00Z'),
  heldUntil: new Date(Date.now() + 60_000),
  state: 'draft',
  submittedAt: null,
  title: 'Přestávka',
}

const updatedAt = new Date('2026-10-28T09:00:00Z')
const previousUpdatedAt = new Date('2026-10-28T08:30:00Z')

const previousMeta = {
  intrinsicHeight: 1000,
  intrinsicWidth: 1000,
  placeholderDataUrl: 'data:image/jpeg;base64,BBBB',
  version: 'v1',
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.permissionContext.mockReturnValue({
    authorId: 'author-1',
    roleLevel: 2,
  })
  mocks.podcastFindUnique.mockResolvedValue(heldPodcast)
  mocks.createId.mockReturnValue('cover-new')
  mocks.isImageOverPixelBudget.mockResolvedValue(false)
  mocks.storeImageVariants.mockResolvedValue(meta)
  mocks.deleteImage.mockResolvedValue(undefined)
  mocks.deleteImageVersion.mockResolvedValue(undefined)
  mocks.coverCreate.mockReturnValue('create-cover')
  mocks.coverUpdate.mockReturnValue('update-cover')
  mocks.podcastUpdateMany.mockReturnValue('first-content')
  mocks.podcastUpdate.mockReturnValue('touch-podcast')
  mocks.podcastFindUniqueOrThrow.mockReturnValue('read-previous')
  mocks.coverFindUnique.mockResolvedValue({ id: 'cover-1', ...previousMeta })
  mocks.coverDelete.mockReturnValue('delete-cover')
  // Each write resolves to its own result; the first content counts one row.
  mocks.transaction.mockImplementation(async (writes: unknown[]) =>
    writes.map((write) =>
      write === 'first-content'
        ? { count: 1 }
        : write === 'touch-podcast'
          ? { updatedAt }
          : write === 'read-previous'
            ? { updatedAt: previousUpdatedAt }
            : { id: 'cover' },
    ),
  )
})

describe('uploadPodcastCover — the input', () => {
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
      uploadPodcastCover(request, { ...target, file }),
    ).rejects.toMatchObject({ init: { status: 400 } })
    expect(mocks.podcastFindUnique).not.toHaveBeenCalled()
  })

  test('refuses an image over the pixel budget before storing it (4al3quzt)', async () => {
    mocks.isImageOverPixelBudget.mockResolvedValue(true)

    expect(
      await uploadPodcastCover(request, { ...target, file: image() }),
    ).toEqual({ reason: 'over-pixel-budget', status: 'failed' })
    expect(mocks.storeImageVariants).not.toHaveBeenCalled()
  })

  test('answers deleted for a podcast that is gone (0036)', async () => {
    mocks.podcastFindUnique.mockResolvedValue(null)

    expect(
      await uploadPodcastCover(request, { ...target, file: image() }),
    ).toEqual({ status: 'deleted' })
  })
})

describe('uploadPodcastCover — the edit hold (log 0019)', () => {
  test('stores nothing for a tab that does not hold the podcast', async () => {
    mocks.podcastFindUnique.mockResolvedValue({
      ...heldPodcast,
      heldByAuthor: { name: 'Marie Horáková' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-2',
    })

    expect(
      await uploadPodcastCover(request, { ...target, file: image() }),
    ).toEqual({ heldByName: 'Marie Horáková', status: 'not-held' })
    expect(mocks.storeImageVariants).not.toHaveBeenCalled()
  })

  test('still lands on a free draft after *Zavřít* released the hold', async () => {
    mocks.podcastFindUnique.mockResolvedValue({
      ...heldPodcast,
      heldByAuthor: null,
      heldByAuthorId: null,
      heldByTabId: null,
    })

    expect(
      await uploadPodcastCover(request, { ...target, file: image() }),
    ).toEqual({ status: 'saved', updatedAt })
  })

  test('drops the stored files when the hold moved before the write', async () => {
    mocks.transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    mocks.podcastFindUnique
      .mockResolvedValueOnce(heldPodcast)
      .mockResolvedValue({
        ...heldPodcast,
        heldByAuthor: { name: 'Marie Horáková' },
        heldByAuthorId: 'author-2',
        heldByTabId: 'tab-2',
      })

    expect(
      await uploadPodcastCover(request, { ...target, file: image() }),
    ).toEqual({ heldByName: 'Marie Horáková', status: 'not-held' })
    expect(mocks.deleteImage).toHaveBeenCalledWith('cover-new')
  })
})

describe('uploadPodcastCover — a first cover', () => {
  test('creates the row with the composed alt text and records the upload', async () => {
    expect(
      await uploadPodcastCover(request, { ...target, file: image() }),
    ).toEqual({ status: 'saved', updatedAt })

    expect(mocks.coverCreate).toHaveBeenCalledWith({
      data: {
        ...meta,
        altText: 'Obálka podcastu Přestávka',
        id: 'cover-new',
        podcastId: 'podcast-1',
      },
      select: { id: true },
    })
    expect(mocks.recordContentLog).toHaveBeenCalledWith(
      {
        entity: 'podcast',
        entityId: 'podcast-1',
        events: ['cover_uploaded'],
      },
      expect.anything(),
    )
  })

  test('ends an empty draft and is its creation in the history (0020)', async () => {
    mocks.podcastFindUnique.mockResolvedValue({
      ...heldPodcast,
      firstContentAt: null,
    })

    await uploadPodcastCover(request, { ...target, file: image() })

    expect(mocks.podcastUpdateMany).toHaveBeenCalledWith({
      data: { firstContentAt: expect.any(Date) },
      where: { firstContentAt: null, id: 'podcast-1' },
    })
    expect(mocks.recordEditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ entity: 'podcast', isCreation: true }),
    )
  })
})

describe('uploadPodcastCover — a replacement', () => {
  beforeEach(() => {
    mocks.podcastFindUnique.mockResolvedValue({
      ...heldPodcast,
      cover: { id: 'cover-1', version: 'v1' },
    })
  })

  test('keeps the id, writes the new version and drops the old one after the commit', async () => {
    await uploadPodcastCover(request, { ...target, file: image() })

    expect(mocks.storeImageVariants).toHaveBeenCalledWith(
      'cover-1',
      expect.any(File),
    )
    expect(mocks.coverUpdate).toHaveBeenCalledWith({
      data: meta,
      select: { id: true },
      where: { id: 'cover-1' },
    })
    expect(mocks.deleteImageVersion).toHaveBeenCalledWith('cover-1', 'v1')
    expect(mocks.podcastUpdateMany).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).toHaveBeenCalledWith(
      { change: 'update', entity: 'podcast', entityId: 'podcast-1' },
      expect.anything(),
    )
  })

  test('a failed upload keeps the old cover', async () => {
    mocks.storeImageVariants.mockRejectedValue(new Error('broken image'))

    expect(
      await uploadPodcastCover(request, { ...target, file: image() }),
    ).toEqual({ status: 'failed' })
    expect(mocks.deleteImage).not.toHaveBeenCalled()
    expect(mocks.coverUpdate).not.toHaveBeenCalled()
  })
})

describe('uploadPodcastCover — a cancel (bxy8xxqs)', () => {
  const uploadCancelled = (cancelAt: 'before' | 'commit') => {
    const controller = new AbortController()
    const cancellableRequest = new Request('https://test.local/', {
      signal: controller.signal,
    })
    if (cancelAt === 'before') controller.abort()
    else {
      const answer = mocks.transaction.getMockImplementation()
      mocks.transaction.mockImplementation(async (writes: unknown[]) => {
        controller.abort()
        return answer?.(writes)
      })
    }
    return uploadPodcastCover(cancellableRequest, { ...target, file: image() })
  }

  test('a cancel before the files are stored stores nothing', async () => {
    expect(await uploadCancelled('before')).toEqual({ status: 'cancelled' })
    expect(mocks.storeImageVariants).not.toHaveBeenCalled()
  })

  test('a first cover cancelled during the commit goes, and the empty draft stays empty', async () => {
    mocks.podcastFindUnique.mockResolvedValue({
      ...heldPodcast,
      firstContentAt: null,
    })

    expect(await uploadCancelled('commit')).toEqual({ status: 'cancelled' })

    expect(mocks.coverDelete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: 'cover-new' },
    })
    expect(mocks.deleteImage).toHaveBeenCalledWith('cover-new')
    expect(mocks.podcastUpdateMany).toHaveBeenLastCalledWith({
      data: { firstContentAt: null, updatedAt: previousUpdatedAt },
      where: { id: 'podcast-1', updatedAt },
    })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
    expect(mocks.recordEditLog).not.toHaveBeenCalled()
  })

  test('a replacement cancelled during the commit gets its previous version back', async () => {
    mocks.podcastFindUnique.mockResolvedValue({
      ...heldPodcast,
      cover: { id: 'cover-1' },
    })

    expect(await uploadCancelled('commit')).toEqual({ status: 'cancelled' })

    expect(mocks.coverUpdate).toHaveBeenLastCalledWith({
      data: previousMeta,
      select: { id: true },
      where: { id: 'cover-1' },
    })
    expect(mocks.deleteImageVersion).toHaveBeenCalledWith('cover-1', 'v2')
    expect(mocks.deleteImageVersion).not.toHaveBeenCalledWith('cover-1', 'v1')
  })
})
