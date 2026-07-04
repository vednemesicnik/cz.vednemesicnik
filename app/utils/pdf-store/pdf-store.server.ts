import { remember } from '@epic-web/remember'

import { createObjectStore } from '~/utils/object-store/create-object-store'
import type { ObjectStore } from '~/utils/object-store/types'

// The PDF store is an ObjectStore scoped to the "pdfs/" namespace, sibling to the
// image store's "images/" in the same shared bucket. The driver (volume vs Tigris)
// is chosen centrally by createObjectStore via STORE_DRIVER.
//
// Single process-wide instance shared by all callers. `remember` keeps it alive
// across dev HMR reloads, so the Tigris driver's S3Client (with its HTTP
// keep-alive pool) is not recreated on every reload — same reasoning as the image
// store and the Prisma client in db.server.ts.
export const pdfStore: ObjectStore = remember('pdf-store', () =>
  createObjectStore({
    prefix: 'pdfs/',
    volumePath: process.env.PDF_STORE_PATH ?? '/data/pdfs',
  }),
)
