import { remember } from '@epic-web/remember'

import { createTigrisImageStore } from './create-tigris-image-store'
import { createVolumeImageStore } from './create-volume-image-store'
import type { ImageStore } from './types'

// Pick the backend from IMAGE_STORE_DRIVER. The volume driver is the default so
// local development and the existing deployment keep working unchanged; setting
// the driver to "tigris" serves variants from the S3-compatible bucket. This is
// the only place aware of which implementation is used — every caller (upload,
// serving, deletion) talks to the same ImageStore interface.
function createImageStore(): ImageStore {
  if (process.env.IMAGE_STORE_DRIVER === 'tigris') {
    return createTigrisImageStore({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      bucket: process.env.BUCKET_NAME ?? '',
      endpoint: process.env.AWS_ENDPOINT_URL_S3 ?? '',
      region: process.env.AWS_REGION ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    })
  }

  return createVolumeImageStore(process.env.IMAGE_STORE_PATH ?? '/data/images')
}

// Single process-wide store instance shared by all callers. `remember` keeps it
// alive across dev HMR reloads, so the Tigris driver's S3Client (with its HTTP
// keep-alive pool) is not recreated on every reload — same reasoning as the
// Prisma client in db.server.ts.
export const imageStore: ImageStore = remember('image-store', createImageStore)
