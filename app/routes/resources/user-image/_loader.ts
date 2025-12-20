import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'
import { createImageResponse, getImageParams } from '~/utils/image.server'
import { getConvertedImageStream } from '~/utils/sharp.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { userId } = params

  const image = await prisma.userImage.findUniqueOrThrow({
    select: { blob: true, contentType: true },
    where: { id: userId },
  })

  const { width, height, quality, format } = getImageParams(request)

  const convertedImage = await getConvertedImageStream(image.blob, {
    format,
    height,
    quality,
    width,
  })

  const tag = getContentHash(request.url)

  return createImageResponse(convertedImage, userId, tag)
}
