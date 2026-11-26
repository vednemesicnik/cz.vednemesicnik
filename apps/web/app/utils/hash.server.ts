import { createHash } from 'node:crypto'

export function getContentHash(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

export function getBytesHash(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex')
}

// Short cache-busting token derived from the image bytes. Editing an image yields
// a new token → a new URL → automatic edge-cache invalidation.
export function getImageVersion(bytes: Uint8Array) {
  return getBytesHash(bytes).slice(0, 8)
}
