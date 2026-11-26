import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { MAX_IMAGE_PIXELS } from '~/config/image-variants-config'

import { generateImageVariants } from './generate-image-variants.server'

// A flat image compresses to little, whatever its pixels.
const createPng = async (width: number, height: number) =>
  new Uint8Array(
    await sharp({
      create: { background: '#4080c0', channels: 3, height, width },
    })
      .png({ compressionLevel: 1 })
      .toBuffer(),
  )

describe('generateImageVariants', () => {
  it('refuses an image over the pixel budget', async () => {
    const png = await createPng(8000, 8000)
    expect(8000 * 8000).toBeGreaterThan(MAX_IMAGE_PIXELS)

    await expect(generateImageVariants(png)).rejects.toThrow(
      'Input image exceeds pixel limit',
    )
  })

  it('refuses a tall image over the budget whose width is small', async () => {
    const png = await createPng(1000, 41_000)

    await expect(generateImageVariants(png)).rejects.toThrow(
      'Input image exceeds pixel limit',
    )
  })

  it('makes the variants of an image within the budget', async () => {
    const png = await createPng(400, 300)

    const generated = await generateImageVariants(png)

    expect(generated.intrinsicWidth).toBe(400)
    expect(generated.intrinsicHeight).toBe(300)
    expect(
      generated.variants.map(({ format, width }) => `${format} ${width}`),
    ).toEqual(['avif 320', 'jpeg 320'])
  })
})
