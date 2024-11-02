// noinspection JSUnusedGlobalSymbols,TypeScriptValidateJSTypes

import { type LoaderFunctionArgs } from "@remix-run/node"
import { type ParamParseKey } from "@remix-run/router"

import {
  FORMAT_SEARCH_PARAM,
  HEIGHT_SEARCH_PARAM,
  QUALITY_SEARCH_PARAM,
  WIDTH_SEARCH_PARAM,
} from "~/utils/create-image-source-route"
import { prisma } from "~/utils/db.server"
import { convertImage } from "~/utils/sharp.server"

type RouteParams = Record<ParamParseKey<"resources/podcast-cover/:id">, string>

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { id } = params as RouteParams

  const url = new URL(request.url)
  const width = url.searchParams.get(WIDTH_SEARCH_PARAM)
  const height = url.searchParams.get(HEIGHT_SEARCH_PARAM)
  const quality = url.searchParams.get(QUALITY_SEARCH_PARAM)
  const format = url.searchParams.get(FORMAT_SEARCH_PARAM)

  const image = await prisma.podcastCover.findUniqueOrThrow({
    where: { id: id },
    select: { contentType: true, blob: true },
  })

  const convertedImage = await convertImage(image.blob, {
    width,
    height,
    quality,
    format,
  })

  return new Response(convertedImage.blob, {
    headers: {
      "Content-Type": convertedImage.contentType,
      "Content-Length": Buffer.byteLength(convertedImage.blob).toString(),
      "Content-Disposition": `inline; filename="${id}"`,
      "Cache-Control": "public, max-age=31536000, immutable", // 31536000 seconds = 365 days
    },
  })
}
