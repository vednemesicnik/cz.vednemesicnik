// noinspection JSUnusedGlobalSymbols,TypeScriptValidateJSTypes

import { type LoaderFunctionArgs } from "@remix-run/node"
import { type ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"

type RouteParams = Record<ParamParseKey<"resources/user-image/:id">, string>

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params as RouteParams

  const image = await prisma.userImage.findUnique({
    where: { id: id },
    select: { contentType: true, blob: true },
  })

  if (image === null)
    return new Response("User image not found.", { status: 404 })

  return new Response(image.blob, {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": Buffer.byteLength(image.blob).toString(),
      "Content-Disposition": `inline; filename="${id}"`,
      "Cache-Control": "public, max-age=31536000, immutable", // 31536000 seconds = 365 days
    },
  })
}
