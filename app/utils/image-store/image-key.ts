import type { ImageVariantFormat } from '~/config/image-variants-config'
import {
  IMAGE_CONTENT_TYPE,
  IMAGE_VARIANT_FORMATS,
  IMAGE_VARIANT_WIDTHS,
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
// it as a prefix for `ImageStore.delete`.
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

// Whitelist of variant file names the read path will serve: the OG crop plus
// every "<width>.<format>" from the canonical matrix. Rejecting anything else
// prevents path traversal and unbounded cache keys.
const VALID_VARIANT_NAMES = new Set<string>([
  OG_VARIANT_NAME,
  ...IMAGE_VARIANT_WIDTHS.flatMap((width) =>
    IMAGE_VARIANT_FORMATS.map((format) => `${width}.${format}`),
  ),
])

export function isValidVariantName(variant: string) {
  return VALID_VARIANT_NAMES.has(variant)
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
