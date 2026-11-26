import {
  buildKeyFromVariant,
  getVariantContentType,
  isValidVariantName,
} from './image-key'
import { imageStore } from './image-store.server'

// Read path: no Sharp, no DB. The version in the URL + immutable caching means a
// present file is always valid, and an absent one is a plain 404. The variant name
// is shape-validated ("<width>.<format>" or the OG crop) to block traversal, and
// nonexistent widths simply 404 since only files on disk are served.
export async function serveImageVariant(
  id: string,
  version: string,
  variant: string,
) {
  if (!isValidVariantName(variant)) {
    throw new Response('Neplatná varianta obrázku', { status: 400 })
  }

  const stream = await imageStore.getStream(
    buildKeyFromVariant(id, version, variant),
  )

  if (stream === null) {
    throw new Response('Obrázek nebyl nalezen', { status: 404 })
  }

  return new Response(stream, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': getVariantContentType(variant),
    },
  })
}
