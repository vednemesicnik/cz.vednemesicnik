import { prisma } from "~/utils/db.server"
import { getContentHash } from "~/utils/hash.server"
import { createImageResponse, getImageParams } from "~/utils/image.server"
import { getConvertedImageStream } from "~/utils/sharp.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { episodeId } = params

  const image = await prisma.podcastEpisodeCover.findUniqueOrThrow({
    where: { id: episodeId },
    select: { contentType: true, blob: true },
  })

  const { width, height, quality, format } = getImageParams(request)

  const convertedImage = await getConvertedImageStream(image.blob, {
    width,
    height,
    quality,
    format,
  })

  const tag = getContentHash(request.url)

  return createImageResponse(convertedImage, episodeId, tag)
}
