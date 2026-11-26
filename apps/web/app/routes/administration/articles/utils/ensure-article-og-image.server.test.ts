import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ensureArticleOgImage } from './ensure-article-og-image.server'

const mocks = vi.hoisted(() => ({
  ensureOgImage: vi.fn(),
  findUnique: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { articleImage: { findUnique: mocks.findUnique } },
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  ensureOgImage: mocks.ensureOgImage,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ensureArticleOgImage', () => {
  test('makes the crop of the stored version', async () => {
    mocks.findUnique.mockResolvedValue({ intrinsicWidth: 2400, version: 'v2' })

    await ensureArticleOgImage('image-1')

    expect(mocks.ensureOgImage).toHaveBeenCalledWith('image-1', 'v2', 2400)
  })

  test('does nothing without a main image', async () => {
    await ensureArticleOgImage(null)

    expect(mocks.findUnique).not.toHaveBeenCalled()
    expect(mocks.ensureOgImage).not.toHaveBeenCalled()
  })

  test('does nothing when the image is gone', async () => {
    mocks.findUnique.mockResolvedValue(null)

    await ensureArticleOgImage('image-1')

    expect(mocks.ensureOgImage).not.toHaveBeenCalled()
  })
})
