import { IMAGE_QUALITY_CONFIG } from '~/config/image-quality-config'
import {
  IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from '~/config/image-variants-config'
import { sharp } from '~/utils/sharp.server'

import { generateImageVariants } from './generate-image-variants.server'
import {
  buildImagePrefix,
  buildOgKey,
  buildVariantKey,
  buildVersionPrefix,
} from './image-key'
import { imageStore } from './image-store.server'
import { selectVariantWidths } from './select-variant-widths'

// DB-facing metadata written onto the owning image row.
export type StoredImageMeta = {
  version: string
  intrinsicWidth: number
  intrinsicHeight: number
  placeholderDataUrl: string
}

// Generate the full variant matrix for `id` and persist every file to the store.
// Files are written before the caller commits the row, per the FS↔DB ordering rule.
export async function storeImageVariants(
  id: string,
  input: Uint8Array | File,
): Promise<StoredImageMeta> {
  const generated = await generateImageVariants(input)
  const { version } = generated

  await Promise.all(
    generated.variants.map((variant) =>
      imageStore.put(
        buildVariantKey(id, version, variant.width, variant.format),
        variant.data,
        IMAGE_CONTENT_TYPE[variant.format],
      ),
    ),
  )

  return {
    intrinsicHeight: generated.intrinsicHeight,
    intrinsicWidth: generated.intrinsicWidth,
    placeholderDataUrl: generated.placeholderDataUrl,
    version,
  }
}

// Lazily derive the dedicated 1200×630 OG/social crop from the largest stored JPEG
// variant. Idempotent: only images that actually become featured get an OG file,
// and re-featuring an existing image works without needing the original bytes.
export async function ensureOgImage(
  id: string,
  version: string,
  intrinsicWidth: number,
) {
  const ogKey = buildOgKey(id, version)
  if (await imageStore.exists(ogKey)) return

  const widths = selectVariantWidths(intrinsicWidth)
  const largestWidth = widths[widths.length - 1]
  const source = await imageStore.getStream(
    buildVariantKey(id, version, largestWidth, 'jpeg'),
  )
  if (source === null) return

  const sourceBytes = new Uint8Array(await new Response(source).arrayBuffer())
  const { jpeg } = IMAGE_QUALITY_CONFIG
  const ogBuffer = await sharp(sourceBytes)
    .resize({
      fit: 'cover',
      height: OG_IMAGE_SIZE.height,
      width: OG_IMAGE_SIZE.width,
    })
    .jpeg({
      mozjpeg: jpeg.mozjpeg,
      progressive: jpeg.progressive,
      quality: jpeg.quality,
    })
    .toBuffer()

  await imageStore.put(
    ogKey,
    Uint8Array.from(ogBuffer),
    IMAGE_CONTENT_TYPE.jpeg,
  )
}

// Remove every file for a single (id, version) — used after an edit replaces the
// image with a new version.
export async function deleteImageVersion(id: string, version: string) {
  await imageStore.delete([buildVersionPrefix(id, version)])
}

// Remove every version of an image — used when the owning row is deleted.
export async function deleteImage(id: string) {
  await imageStore.delete([buildImagePrefix(id)])
}
