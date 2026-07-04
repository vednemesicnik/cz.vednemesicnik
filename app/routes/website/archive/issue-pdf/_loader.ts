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

  // `id` builds the object-store key, `updatedAt` drives cache validation, and
  // `contentType` sets the response header — the PDF bytes live in the object store.
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

  const stream = await pdfStore.getStream(buildPdfKey(pdf.id))
  if (stream === null) {
    throw new Response('PDF soubor nebyl nalezen', { status: 404 })
  }

  return buildPdfResponse(stream, meta)
}
