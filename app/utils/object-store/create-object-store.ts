import { createTigrisObjectStore } from './create-tigris-object-store'
import { createVolumeObjectStore } from './create-volume-object-store'
import type { ObjectStore } from './types'

type CreateObjectStoreArgs = {
  // Tigris namespace prefix for this store (e.g. "images/", "pdfs/"), so several
  // stores can share one bucket. Ignored by the volume driver, which namespaces
  // via `volumePath` (a distinct on-disk directory per store) instead.
  prefix: string
  // Root directory for the volume driver (e.g. "/data/images", "/data/pdfs").
  volumePath: string
}

// Pick the backend from STORE_DRIVER — the single toggle shared by every store
// (images, PDFs, …). The volume driver is the default so local development and
// the existing deployment keep working unchanged; "tigris" serves objects from
// the S3-compatible bucket. This is the only place aware of which implementation
// is used — callers only ever see the ObjectStore interface.
export function createObjectStore({
  prefix,
  volumePath,
}: CreateObjectStoreArgs): ObjectStore {
  if (process.env.STORE_DRIVER === 'tigris') {
    return createTigrisObjectStore({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      bucket: process.env.BUCKET_NAME ?? '',
      endpoint: process.env.AWS_ENDPOINT_URL_S3 ?? '',
      keyPrefix: prefix,
      region: process.env.AWS_REGION ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    })
  }

  return createVolumeObjectStore(volumePath)
}
