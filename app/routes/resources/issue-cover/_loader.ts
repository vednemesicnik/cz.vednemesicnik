import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'
import {
  checkCacheValidation,
  createImageResponse,
  getImageParams,
} from '~/utils/image.server'
import { getConvertedImageStream } from '~/utils/sharp.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { id } = params

  // Generate ETag from URL (includes all image params)
  const tag = getContentHash(request.url)

  // Check if client has cached version
  const cachedResponse = checkCacheValidation(request, tag)
  if (cachedResponse !== null) return cachedResponse

  // Client doesn't have cached version - generate and return image
  const image = await prisma.issueCover.findUniqueOrThrow({
    select: { blob: true },
    where: { id },
  })

  const { width, height, quality, format } = getImageParams(request)

  const convertedImage = await getConvertedImageStream(image.blob, {
    format,
    height,
    quality,
    width,
  })

  return createImageResponse(convertedImage, id, tag)
}
