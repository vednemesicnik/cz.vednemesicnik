// noinspection JSUnusedGlobalSymbols,TypeScriptValidateJSTypes

import { type LoaderFunctionArgs } from "@remix-run/node"
import { type ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"
import { createImageResponse, getImageParams } from "~/utils/image.server"
import { convertImage } from "~/utils/sharp.server"

type RouteParams = Record<ParamParseKey<"resources/user-image/:id">, string>

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { id } = params as RouteParams

  const image = await prisma.userImage.findUniqueOrThrow({
    where: { id: id },
    select: { contentType: true, blob: true },
  })

  const { width, height, quality, format } = getImageParams(request)

  const convertedImage = await convertImage(image.blob, {
    width,
    height,
    quality,
    format,
  })

  return createImageResponse(convertedImage, id)
}
