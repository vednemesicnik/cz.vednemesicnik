import type { ImageVariantFormat } from '~/config/image-variants-config'
import {
  IMAGE_CONTENT_TYPE,
  IMAGE_VARIANT_FORMATS,
} from '~/config/image-variants-config'

// Storage is keyed by the image row `id` (not by content bytes): each row owns its
// image, so deletion is a simple `rm` of the row's directory with no orphans or
// reference-counting. The `version` token busts the cache on edit.
//
// Layout: <shard>/<id>/<version>/<name>
//  - <shard> = first two chars of `id`, so a single directory never holds
//    hundreds of thousands of entries.
//  - <name>  = "<width>.<format>" for responsive variants, "og.jpeg" for the crop.

export const OG_VARIANT_NAME = 'og.jpeg'

function getShard(id: string) {
  return id.slice(0, 2)
}

// Directory holding every variant for a given (id, version). Trailing slash marks
// it as a prefix for `ObjectStore.delete`.
export function buildVersionPrefix(id: string, version: string) {
  return `${getShard(id)}/${id}/${version}/`
}

// Directory holding every version of a given id. Used to wipe an image entirely
// when its owning row is deleted.
export function buildImagePrefix(id: string) {
  return `${getShard(id)}/${id}/`
}

export function buildVariantKey(
  id: string,
  version: string,
  width: number,
  format: ImageVariantFormat,
) {
  return `${buildVersionPrefix(id, version)}${width}.${format}`
}

export function buildOgKey(id: string, version: string) {
  return `${buildVersionPrefix(id, version)}${OG_VARIANT_NAME}`
}

// Variant file names the read path will serve: the OG crop plus any
// "<width>.<format>" where width is a positive integer and format is a delivered
// format. Widths are not restricted to the canonical ladder because small images
// (below the smallest ladder step) get a single variant at their intrinsic width
// (see `selectVariantWidths`), which would otherwise be rejected. Constraining the
// shape to digits + a known extension still blocks path traversal, and the read
// path only serves files that actually exist on disk, so unbounded/nonexistent
// widths simply 404.
const VARIANT_NAME_PATTERN = new RegExp(
  `^[1-9][0-9]*\\.(?:${IMAGE_VARIANT_FORMATS.join('|')})$`,
)

export function isValidVariantName(variant: string) {
  return variant === OG_VARIANT_NAME || VARIANT_NAME_PATTERN.test(variant)
}

// Content type for a (validated) variant file name, from its extension.
export function getVariantContentType(variant: string) {
  return variant.endsWith('.avif')
    ? IMAGE_CONTENT_TYPE.avif
    : IMAGE_CONTENT_TYPE.jpeg
}

// Store key for a raw variant file name coming from a resource-route param.
export function buildKeyFromVariant(
  id: string,
  version: string,
  variant: string,
) {
  return `${buildVersionPrefix(id, version)}${variant}`
}
