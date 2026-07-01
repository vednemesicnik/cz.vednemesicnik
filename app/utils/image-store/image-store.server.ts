import { createVolumeImageStore } from './create-volume-image-store'
import type { ImageStore } from './types'

// Single process-wide store instance. Swapping the volume implementation for a
// Tigris/S3 adapter later is a one-line change here, transparent to all callers.
export const imageStore: ImageStore = createVolumeImageStore(
  process.env.IMAGE_STORE_PATH ?? '/data/images',
)
