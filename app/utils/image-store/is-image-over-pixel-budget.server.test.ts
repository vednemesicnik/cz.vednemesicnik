import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { isImageOverPixelBudget } from './is-image-over-pixel-budget.server'

const createPngFile = async (width: number, height: number) =>
  new File(
    [
      await sharp({
        create: { background: '#4080c0', channels: 3, height, width },
      })
        .png({ compressionLevel: 1 })
        .toBuffer(),
    ],
    'image.png',
    { type: 'image/png' },
  )

describe('isImageOverPixelBudget', () => {
  it('is true for an image over 40 megapixels', async () => {
    await expect(
      isImageOverPixelBudget(await createPngFile(8000, 8000)),
    ).resolves.toBe(true)
  })

  it('is true for a narrow image whose area is over the budget', async () => {
    await expect(
      isImageOverPixelBudget(await createPngFile(1000, 41_000)),
    ).resolves.toBe(true)
  })

  it('is false for an image within the budget', async () => {
    await expect(
      isImageOverPixelBudget(await createPngFile(7680, 5120)),
    ).resolves.toBe(false)
  })

  it('is false for a file Sharp cannot read', async () => {
    const file = new File(['not an image'], 'broken.png', { type: 'image/png' })

    await expect(isImageOverPixelBudget(file)).resolves.toBe(false)
  })
})
