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

  // `id` is the object-store key; `blob` is the legacy fallback; `updatedAt` drives
  // cache validation.
  const pdf = await prisma.issuePDF.findUnique({
    select: { blob: true, contentType: true, id: true, updatedAt: true },
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

  // Prefer the object store; fall back to the legacy in-DB blob for rows not yet
  // backfilled (transitional — removed with the blob column in issue #108).
  const stream = await pdfStore.getStream(buildPdfKey(pdf.id))
  if (stream !== null) return buildPdfResponse(stream, meta)

  if (pdf.blob !== null) return buildPdfResponse(pdf.blob, meta)

  throw new Response('PDF soubor nebyl nalezen', { status: 404 })
}
