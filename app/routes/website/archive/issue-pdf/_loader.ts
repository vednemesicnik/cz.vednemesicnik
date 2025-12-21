import { checkCacheValidation } from '~/utils/cache.server'
import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { fileName } = params

  // Fetch PDF with updatedAt for cache validation
  const pdf = await prisma.issuePDF.findUnique({
    select: { blob: true, contentType: true, fileName: true, updatedAt: true },
    where: { fileName },
  })

  if (pdf === null) {
    throw new Response('PDF soubor nebyl nalezen', { status: 404 })
  }

  // Generate ETag from fileName + updatedAt timestamp (invalidates when PDF changes)
  const etag = getContentHash(`${fileName}:${pdf.updatedAt.valueOf()}`)
  const lastModified = pdf.updatedAt.toUTCString()

  // Check if client has cached version (supports both ETag and Last-Modified)
  const cachedResponse = checkCacheValidation(request, etag, lastModified)
  if (cachedResponse !== null) return cachedResponse

  // Client doesn't have cached version - return PDF
  return new Response(pdf.blob, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${pdf.fileName}"`,
      'Content-Length': pdf.blob.byteLength.toString(),
      'Content-Type': pdf.contentType,
      ETag: etag,
      'Last-Modified': lastModified,
    },
  })
}
