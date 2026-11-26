import { remember } from '@epic-web/remember'

import { createObjectStore } from '~/utils/object-store/create-object-store'
import type { ObjectStore } from '~/utils/object-store/types'

// The image store is an ObjectStore scoped to the "images/" namespace. The driver
// (volume vs Tigris) is chosen centrally by createObjectStore via STORE_DRIVER;
// every image caller (upload, serving, deletion) talks to this one instance.
//
// Single process-wide instance shared by all callers. `remember` keeps it alive
// across dev HMR reloads, so the Tigris driver's S3Client (with its HTTP keep-alive
// pool) is not recreated on every reload — same reasoning as the Prisma client in
// db.server.ts.
export const imageStore: ObjectStore = remember('image-store', () =>
  createObjectStore({
    // Images occupy the "images/" namespace of a shared bucket; other content
    // (e.g. issue PDFs) lives under sibling prefixes in the same bucket.
    prefix: 'images/',
    volumePath: process.env.IMAGE_STORE_PATH ?? '/data/images',
  }),
)
