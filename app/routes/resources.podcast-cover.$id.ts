// noinspection JSUnusedGlobalSymbols,TypeScriptValidateJSTypes

import { type LoaderFunctionArgs } from "@remix-run/node"
import { type ParamParseKey } from "@remix-run/router"

import {
  QUALITY_PARAM,
  WIDTH_PARAM,
} from "~/utils/create-image-search-params-string"
import { prisma } from "~/utils/db.server"
import { convertImage } from "~/utils/sharp.server"

type RouteParams = Record<ParamParseKey<"resources/podcast-cover/:id">, string>

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { id } = params as RouteParams

  const url = new URL(request.url)
  const width = url.searchParams.get(WIDTH_PARAM)
  const quality = url.searchParams.get(QUALITY_PARAM)

  const image = await prisma.podcastCover.findUniqueOrThrow({
    where: { id: id },
    select: { contentType: true, blob: true },
  })

  const imageBlob = await convertImage(image.blob, image.contentType, {
    width,
    quality,
  })

  return new Response(imageBlob, {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": Buffer.byteLength(imageBlob).toString(),
      "Content-Disposition": `inline; filename="${id}"`,
      "Cache-Control": "public, max-age=31536000, immutable", // 31536000 seconds = 365 days
    },
  })
}
