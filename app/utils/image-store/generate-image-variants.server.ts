import { IMAGE_QUALITY_CONFIG } from '~/config/image-quality-config'
import type { ImageVariantFormat } from '~/config/image-variants-config'
import { LQIP_WIDTH } from '~/config/image-variants-config'
import { getImageVersion } from '~/utils/hash.server'
import { sharp } from '~/utils/sharp.server'

import { selectVariantWidths } from './select-variant-widths'

export type GeneratedVariant = {
  width: number
  format: ImageVariantFormat
  data: Uint8Array
}

export type GeneratedImage = {
  // Cache-busting token derived from the original bytes.
  version: string
  intrinsicWidth: number
  intrinsicHeight: number
  // Inline LQIP placeholder (JPEG data URI) — 0 network requests.
  placeholderDataUrl: string
  // Responsive width variants (avif + jpeg per width).
  variants: GeneratedVariant[]
}

// Copy into a standalone Uint8Array — Sharp's Buffers come from a shared pool, so
// a view would risk aliasing bytes reused by a later operation.
const toBytes = (buffer: Buffer) => Uint8Array.from(buffer)

// Runs Sharp once per input to produce the full variant matrix (widths × formats)
// + inline LQIP. This is the only place Sharp runs on upload; the OG crop is
// derived lazily (see ensureOgImage) and the read path just streams files.
export async function generateImageVariants(
  input: Uint8Array | File,
): Promise<GeneratedImage> {
  const original =
    input instanceof File ? new Uint8Array(await input.arrayBuffer()) : input

  const version = getImageVersion(original)

  // Normalise EXIF orientation up front so every derived variant is upright.
  const base = sharp(original, { failOn: 'none' }).rotate()
  const metadata = await base.metadata()

  // After `.rotate()`, orientation ≥ 5 means the displayed dimensions are swapped.
  const isRotated = (metadata.orientation ?? 1) >= 5
  const intrinsicWidth = isRotated ? metadata.height : metadata.width
  const intrinsicHeight = isRotated ? metadata.width : metadata.height

  if (!intrinsicWidth || !intrinsicHeight) {
    throw new Error('Nepodařilo se přečíst rozměry obrázku')
  }

  const widths = selectVariantWidths(intrinsicWidth)

  const { avif, jpeg } = IMAGE_QUALITY_CONFIG

  const variants: GeneratedVariant[] = []
  for (const width of widths) {
    const resized = base.clone().resize({ width, withoutEnlargement: true })

    const [avifData, jpegData] = await Promise.all([
      resized
        .clone()
        .avif({ effort: avif.effort, quality: avif.quality })
        .toBuffer(),
      resized
        .clone()
        .jpeg({
          mozjpeg: jpeg.mozjpeg,
          progressive: jpeg.progressive,
          quality: jpeg.quality,
        })
        .toBuffer(),
    ])

    variants.push(
      { data: toBytes(avifData), format: 'avif', width },
      { data: toBytes(jpegData), format: 'jpeg', width },
    )
  }

  // LQIP: tiny JPEG inlined as a data URI, upscaled with `image-rendering:
  // pixelated` on the client (no blur — the blocky look is intentional).
  const lqipBuffer = await base
    .clone()
    .resize({ width: LQIP_WIDTH })
    .jpeg({ quality: IMAGE_QUALITY_CONFIG.lqip.quality })
    .toBuffer()
  const placeholderDataUrl = `data:image/jpeg;base64,${lqipBuffer.toString('base64')}`

  return {
    intrinsicHeight,
    intrinsicWidth,
    placeholderDataUrl,
    variants,
    version,
  }
}
