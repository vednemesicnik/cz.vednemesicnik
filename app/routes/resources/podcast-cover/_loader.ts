import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'
import { createImageResponse, getImageParams } from '~/utils/image.server'
import { getConvertedImageStream } from '~/utils/sharp.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { podcastId } = params

  const image = await prisma.podcastCover.findUniqueOrThrow({
    select: { blob: true, contentType: true },
    where: { id: podcastId },
  })

  const { width, height, quality, format } = getImageParams(request)

  const convertedImage = await getConvertedImageStream(image.blob, {
    format,
    height,
    quality,
    width,
  })

  const tag = getContentHash(request.url)

  return createImageResponse(convertedImage, podcastId, tag)
}
