import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ISSUE_FILE_CONFIG } from '~/config/issue-file-config'

import type { FileChangeIssue } from './save-issue-file-change.server'
import { uploadIssueCover } from './upload-issue-cover.server'

const mocks = vi.hoisted(() => ({
  createId: vi.fn(),
  deleteImage: vi.fn(),
  deleteImageVersion: vi.fn(),
  isImageOverPixelBudget: vi.fn(),
  issueCoverCreate: vi.fn(),
  issueCoverDelete: vi.fn(),
  issueCoverFindUnique: vi.fn(),
  issueCoverUpdate: vi.fn(),
  saveIssueFileChange: vi.fn(),
  storeImageVariants: vi.fn(),
}))

vi.mock('@paralleldrive/cuid2', () => ({ createId: mocks.createId }))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    issueCover: {
      create: mocks.issueCoverCreate,
      delete: mocks.issueCoverDelete,
      findUnique: mocks.issueCoverFindUnique,
      update: mocks.issueCoverUpdate,
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

vi.mock('./save-issue-file-change.server', () => ({
  saveIssueFileChange: mocks.saveIssueFileChange,
}))

const request = new Request('https://test.local/')

const issue: FileChangeIssue = {
  cover: null,
  name: 'podzim',
  order: 4,
  pdf: null,
  state: 'draft',
  supplement: null,
  supplementSlug: '',
  year: 2026,
}

const meta = {
  intrinsicHeight: 1600,
  intrinsicWidth: 1131,
  placeholderDataUrl: 'data:image/jpeg;base64,AAAA',
  version: 'v2',
}

const previousMeta = { ...meta, version: 'v1' }

const run = async (stored: Partial<FileChangeIssue> = {}) => {
  await uploadIssueCover(request, {
    file: new File(['bytes'], 'obalka.jpg', { type: 'image/jpeg' }),
    issueId: 'issue-1',
    tabId: 'tab-1',
  })
  const { prepare } = mocks.saveIssueFileChange.mock.lastCall?.[1] ?? {}
  return prepare({ ...issue, ...stored })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.createId.mockReturnValue('cover-new')
  mocks.saveIssueFileChange.mockResolvedValue({ status: 'saved' })
  mocks.isImageOverPixelBudget.mockResolvedValue(false)
  mocks.storeImageVariants.mockResolvedValue(meta)
  mocks.deleteImage.mockResolvedValue(undefined)
  mocks.deleteImageVersion.mockResolvedValue(undefined)
  mocks.issueCoverCreate.mockReturnValue('create-cover')
  mocks.issueCoverUpdate.mockReturnValue('update-cover')
  mocks.issueCoverFindUnique.mockResolvedValue({
    id: 'cover-1',
    ...previousMeta,
  })
})

describe('uploadIssueCover — the input', () => {
  test.each([
    ['an empty file', new File([], 'empty.jpg', { type: 'image/jpeg' })],
    [
      'a file over the limit',
      new File(
        [new Uint8Array(ISSUE_FILE_CONFIG.cover.maxFileBytes + 1)],
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
      uploadIssueCover(request, { file, issueId: 'issue-1', tabId: 'tab-1' }),
    ).rejects.toMatchObject({ init: { status: 400 } })

    expect(mocks.saveIssueFileChange).not.toHaveBeenCalled()
  })

  test('refuses an image over the pixel budget before storing it', async () => {
    mocks.isImageOverPixelBudget.mockResolvedValue(true)

    const prepared = await run()

    expect(prepared).toEqual({ reason: 'over-pixel-budget', status: 'failed' })
    expect(mocks.storeImageVariants).not.toHaveBeenCalled()
  })
})

describe('uploadIssueCover — a new cover', () => {
  test('stores the variants, then creates the row with the alt text', async () => {
    const prepared = await run()

    expect(mocks.storeImageVariants).toHaveBeenCalledWith(
      'cover-new',
      expect.any(File),
    )
    expect(mocks.issueCoverCreate).toHaveBeenCalledWith({
      data: {
        ...meta,
        altText: 'Obálka čísla podzim 2026',
        id: 'cover-new',
        issueId: 'issue-1',
      },
      select: { id: true },
    })
    expect(prepared).toMatchObject({
      addsContent: true,
      logEvent: 'cover_uploaded',
      writes: ['create-cover'],
    })
  })

  test('a failed store answers failed and drops what landed', async () => {
    mocks.storeImageVariants.mockRejectedValue(new Error('sharp'))

    const prepared = await run()

    expect(prepared).toEqual({ status: 'failed' })
    expect(mocks.deleteImage).toHaveBeenCalledWith('cover-new')
  })

  test('a cancel after the commit deletes the row and its files', async () => {
    const prepared = await run()
    await prepared.onCancelled()

    expect(mocks.issueCoverDelete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: 'cover-new' },
    })
    expect(mocks.deleteImage).toHaveBeenCalledWith('cover-new')
  })
})

describe('uploadIssueCover — a replacement', () => {
  const stored = { cover: { id: 'cover-1' } }

  test('stores a new version under the same id', async () => {
    const prepared = await run(stored)

    expect(mocks.storeImageVariants).toHaveBeenCalledWith(
      'cover-1',
      expect.any(File),
    )
    expect(mocks.issueCoverUpdate).toHaveBeenCalledWith({
      data: meta,
      select: { id: true },
      where: { id: 'cover-1' },
    })
    expect(prepared).not.toHaveProperty('addsContent')
  })

  test('the old version goes only after the commit', async () => {
    const prepared = await run(stored)
    expect(mocks.deleteImageVersion).not.toHaveBeenCalled()

    await prepared.onCommitted()

    expect(mocks.deleteImageVersion).toHaveBeenCalledWith('cover-1', 'v1')
  })

  test('a cancel after the commit puts the old version back', async () => {
    const prepared = await run(stored)
    await prepared.onCancelled()

    expect(mocks.issueCoverUpdate).toHaveBeenLastCalledWith({
      data: previousMeta,
      select: { id: true },
      where: { id: 'cover-1' },
    })
    expect(mocks.deleteImageVersion).toHaveBeenCalledWith('cover-1', 'v2')
  })

  test('a failed store keeps the cover’s files', async () => {
    mocks.storeImageVariants.mockRejectedValue(new Error('sharp'))

    await run(stored)

    expect(mocks.deleteImage).not.toHaveBeenCalled()
  })
})
