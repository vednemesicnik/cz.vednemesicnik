import { checkCacheValidation } from '~/utils/cache.server'
import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'
import { buildPdfKey } from '~/utils/pdf-store/pdf-key'
import { pdfStore } from '~/utils/pdf-store/pdf-store.server'
import {
  buildPdfResponse,
  PDF_CACHE_CONTROL,
} from '~/utils/pdf-store/serve-pdf.server'
import {
  getWebContentVisibility,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'

import type { Route } from './+types/route'

/**
 * Serves the issue PDF without calling `next()`. A missing PDF calls `next()` instead,
 * so the route loader throws the 404 and the website layout boundary renders it
 * (design 30f). Thrown here, it would skip the loaders and reach the root boundary.
 *
 * @returns The PDF, a 304 when the client's copy is current, or the 404 page.
 */
const serveIssuePdf: Route.MiddlewareFunction = async (
  { request, params },
  next,
) => {
  const { fileName } = params

  const visibility = await getWebContentVisibility(request, ['issue'])

  // `id` builds the object-store key, `updatedAt` drives cache validation, and
  // `contentType` sets the response header — the PDF bytes live in the object store.
  // Only the PDF of an issue the web may show: published, or previewed by rights.
  const pdf = await prisma.issuePDF.findUnique({
    select: { contentType: true, id: true, updatedAt: true },
    where: {
      fileName,
      issue: visibility.where('issue', ownByAuthor, ['draft', 'archived']),
    },
  })

  if (pdf === null) return next()

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
  if (stream === null) return next()

  return buildPdfResponse(stream, meta)
}

export const middleware: Route.MiddlewareFunction[] = [serveIssuePdf]
