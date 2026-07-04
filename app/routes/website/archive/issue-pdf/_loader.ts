import { checkCacheValidation } from '~/utils/cache.server'
import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'
import { buildPdfKey } from '~/utils/pdf-store/pdf-key'
import { pdfStore } from '~/utils/pdf-store/pdf-store.server'
import {
  buildPdfResponse,
  PDF_CACHE_CONTROL,
} from '~/utils/pdf-store/serve-pdf.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { fileName } = params

  // Don't select the (large) blob here — `id` builds the object-store key and
  // `updatedAt` drives cache validation. The blob is only needed for the legacy
  // fallback below, and only when the object store misses, so it is loaded lazily
  // to keep the hot path from pulling hundreds of KB out of SQLite per request.
  const pdf = await prisma.issuePDF.findUnique({
    select: { contentType: true, id: true, updatedAt: true },
    where: { fileName },
  })

  if (pdf === null) {
    throw new Response('PDF soubor nebyl nalezen', { status: 404 })
  }

  // ETag from fileName + updatedAt timestamp (invalidates when the PDF changes)
  const etag = getContentHash(`${fileName}:${pdf.updatedAt.valueOf()}`)
  const lastModified = pdf.updatedAt.toUTCString()

  // Check if client has cached version (supports both ETag and Last-Modified)
  const cachedResponse = checkCacheValidation(
    request,
    etag,
    lastModified,
    PDF_CACHE_CONTROL,
  )
  if (cachedResponse !== null) return cachedResponse

  const meta = { contentType: pdf.contentType, etag, fileName, lastModified }

  // Prefer the object store.
  const stream = await pdfStore.getStream(buildPdfKey(pdf.id))
  if (stream !== null) return buildPdfResponse(stream, meta)

  // Store miss → fall back to the legacy in-DB blob, loaded only now, for rows not
  // yet backfilled (transitional — removed with the blob column in issue #108).
  const legacy = await prisma.issuePDF.findUnique({
    select: { blob: true },
    where: { id: pdf.id },
  })
  if (legacy?.blob != null) return buildPdfResponse(legacy.blob, meta)

  throw new Response('PDF soubor nebyl nalezen', { status: 404 })
}
