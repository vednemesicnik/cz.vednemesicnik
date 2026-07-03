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
//
// Deliberate quality compromise: we re-encode from the already-compressed JPEG
// variant (q80), not the original bytes, so the crop is lossy-on-lossy; and when
// the intrinsic width is < 1200 it is upscaled. This is acceptable — the OG image
// is only ever shown as a small social-card thumbnail, and keeping the originals
// around solely for this crop is not worth the storage.
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

// Delete a row (or rows) and then remove the associated image-store files.
// Ordering rule (delete files after DB, never before): the store ids are loaded
// and the DB delete runs first; the store files are wiped only AFTER the delete
// has committed, so a failed delete never removes files that still have live
// rows. Every id's prefix goes in a single `delete` call so the backend can
// batch/limit the removals itself. A no-op when there are no image ids (e.g. the
// parent has no cover).
export async function deleteRowWithImages<T>(
  loadImageIds: () => Promise<string[]>,
  deleteRow: () => Promise<T>,
): Promise<T> {
  const imageIds = await loadImageIds()
  const result = await deleteRow()
  if (imageIds.length > 0) {
    await imageStore.delete(imageIds.map((id) => buildImagePrefix(id)))
  }
  return result
}

// Row data for a single cover column, spread into a Prisma `cover.update.data`.
// The store fields are absent when the cover file is left unchanged (only the
// alt text is written).
export type CoverUpdateData = { altText: string } & Partial<StoredImageMeta>

type PrepareCoverReplacementArgs = {
  coverId: string
  altText: string
  previousVersion: string | null
  file: File | undefined
}

// Prepare a cover replacement for an edit action. When a new `file` is supplied
// its variants are stored (before the caller commits the row) and the returned
// `data` carries the fresh version + dimensions; otherwise only `altText` is
// updated. The returned `cleanup` drops the previous version's files and MUST be
// called only after the DB update has committed (delete files after DB, never
// before). It is a no-op when nothing changed.
export async function prepareCoverReplacement({
  coverId,
  altText,
  previousVersion,
  file,
}: PrepareCoverReplacementArgs): Promise<{
  data: CoverUpdateData
  cleanup: () => Promise<void>
}> {
  if (file === undefined) {
    return { cleanup: async () => {}, data: { altText } }
  }

  const meta = await storeImageVariants(coverId, file)

  return {
    cleanup: async () => {
      if (previousVersion && previousVersion !== meta.version) {
        await deleteImageVersion(coverId, previousVersion)
      }
    },
    data: { altText, ...meta },
  }
}
