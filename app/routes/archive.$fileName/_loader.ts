import { type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"

type RouteParams = Record<ParamParseKey<"archive/:fileName">, string>

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { fileName } = params as RouteParams

  const pdf = await prisma.archivedIssuePDF.findUniqueOrThrow({
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
