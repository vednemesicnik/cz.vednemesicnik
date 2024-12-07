import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { fileName } = params

  const pdf = await prisma.issuePDF.findUniqueOrThrow({
    where: { fileName },
    select: { fileName: true, contentType: true, blob: true },
  })

  return new Response(pdf.blob, {
    headers: {
      "Content-Type": pdf.contentType,
      "Content-Length": Buffer.byteLength(pdf.blob).toString(),
      "Content-Disposition": `inline; filename="${pdf.fileName}"`,
      "Cache-Control": "public, max-age=31536000, immutable", // 31536000 seconds = 365 days
    },
  })
}
