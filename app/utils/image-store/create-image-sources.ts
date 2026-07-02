import type { ImageResourceKind } from './image-url'
import { buildImageVariantUrl } from './image-url'
import { selectVariantWidths } from './select-variant-widths'

// Plain HTML <img>/<picture> source attributes for the <Image> component. Built by
// `createImageSources` from a DB row so the component stays a dumb, HTML-native
// renderer. Fields are undefined when there is no image.
export type ImageSources = {
  // Fallback URL (largest JPEG) — a real, directly loadable image.
  src: string | undefined
  // JPEG `srcset` with `w` descriptors.
  srcSet: string | undefined
  // AVIF `srcset` for the <picture> <source>.
  avifSrcSet: string | undefined
  width: number | undefined
  height: number | undefined
  // Inline LQIP data URI.
  placeholder: string | undefined
}

// Prisma select fragment for the columns `createImageSources` needs (spread into a
// loader's `select`/`include`). `altText` is included for convenience since callers
// usually pass it to <Image alt>.
export const imageSourceSelect = {
  altText: true,
  id: true,
  intrinsicHeight: true,
  intrinsicWidth: true,
  placeholderDataUrl: true,
  version: true,
} as const

// Row shape consumed by `createImageSources`. The store fields are always present
// on a stored row; the row itself is null/undefined when there is no image.
export type ImageRow = {
  id: string
  version: string
  intrinsicWidth: number
  intrinsicHeight: number
  placeholderDataUrl: string
}

const EMPTY_SOURCES: ImageSources = {
  avifSrcSet: undefined,
  height: undefined,
  placeholder: undefined,
  src: undefined,
  srcSet: undefined,
  width: undefined,
}

// Build responsive sources from an image row. The browser picks a width from
// `sizes` + DPR, so there are no 1x/2x variants. Returns empty sources (all
// undefined) when the row is missing, so <Image> renders an empty placeholder.
export function createImageSources(
  kind: ImageResourceKind,
  row: ImageRow | null | undefined,
): ImageSources {
  if (!row) {
    return EMPTY_SOURCES
  }

  const { id, version, intrinsicWidth, intrinsicHeight, placeholderDataUrl } =
    row
  const widths = selectVariantWidths(intrinsicWidth)

  const toSrcSet = (format: 'avif' | 'jpeg') =>
    widths
      .map(
        (width) =>
          `${buildImageVariantUrl(kind, id, version, width, format)} ${width}w`,
      )
      .join(', ')

  const largestWidth = widths[widths.length - 1]

  return {
    avifSrcSet: toSrcSet('avif'),
    height: intrinsicHeight,
    placeholder: placeholderDataUrl,
    src: buildImageVariantUrl(kind, id, version, largestWidth, 'jpeg'),
    srcSet: toSrcSet('jpeg'),
    width: intrinsicWidth,
  }
}
