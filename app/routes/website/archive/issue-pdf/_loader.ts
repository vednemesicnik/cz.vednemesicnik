import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { fileName } = params

  const pdf = await prisma.issuePDF.findUnique({
    select: { blob: true, contentType: true, fileName: true },
    where: { fileName },
  })

  if (pdf === null) {
    throw new Response('PDF soubor nebyl nalezen', { status: 404 })
  }

  return new Response(pdf.blob, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable', // 31536000 seconds = 365 days
      'Content-Disposition': `inline; filename="${pdf.fileName}"`,
      'Content-Length': pdf.blob.byteLength.toString(),
      'Content-Type': pdf.contentType,
    },
  })
}
