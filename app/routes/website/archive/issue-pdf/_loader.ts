import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { fileName } = params

  // Generate ETag from fileName (PDFs are immutable per fileName)
  const etag = getContentHash(fileName)

  // Check if client has cached version
  const ifNoneMatch = request.headers.get('If-None-Match')

  if (ifNoneMatch === etag) {
    // Client has cached version - return 304 Not Modified
    return new Response(null, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: etag,
      },
      status: 304,
    })
  }

  // Client doesn't have cached version - fetch and return PDF
  const pdf = await prisma.issuePDF.findUnique({
    select: { blob: true, contentType: true, fileName: true },
    where: { fileName },
  })

  if (pdf === null) {
    throw new Response('PDF soubor nebyl nalezen', { status: 404 })
  }

  return new Response(pdf.blob, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${pdf.fileName}"`,
      'Content-Length': pdf.blob.byteLength.toString(),
      'Content-Type': pdf.contentType,
      ETag: etag,
    },
  })
}
