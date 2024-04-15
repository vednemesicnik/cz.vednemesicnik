// noinspection JSUnusedGlobalSymbols,TypeScriptValidateJSTypes

import { prisma } from "~/utils/db.server"
import type { LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

const ROUTE = "resources/archived-issue-pdf/:id"
type RouteParams = Record<ParamParseKey<typeof ROUTE>, string>

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params as RouteParams

  const pdf = await prisma.archivedIssuePDF.findUnique({
    where: { id: id },
    select: { fileName: true, contentType: true, blob: true },
  })

  if (pdf === null) return new Response("Archived issue PDF not found.", { status: 404 })

  return new Response(pdf.blob, {
    headers: {
      "Content-Type": pdf.contentType,
      "Content-Length": Buffer.byteLength(pdf.blob).toString(),
      "Content-Disposition": `inline; filename="${pdf.fileName}"`,
      "Cache-Control": "public, max-age=31536000, immutable", // 31536000 seconds = 365 days
    },
  })
}
