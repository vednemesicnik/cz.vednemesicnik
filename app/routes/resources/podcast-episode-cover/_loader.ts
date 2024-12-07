import { prisma } from "~/utils/db.server"
import { createImageResponse, getImageParams } from "~/utils/image.server"
import { convertImage } from "~/utils/sharp.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { episodeId } = params

  const image = await prisma.podcastEpisodeCover.findUniqueOrThrow({
    where: { id: episodeId },
    select: { contentType: true, blob: true },
  })

  const { width, height, quality, format } = getImageParams(request)

  const convertedImage = await convertImage(image.blob, {
    width,
    height,
    quality,
    format,
  })

  return createImageResponse(convertedImage, episodeId)
}
