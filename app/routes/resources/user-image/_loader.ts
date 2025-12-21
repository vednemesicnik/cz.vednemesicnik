import { checkCacheValidation } from '~/utils/cache.server'
import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'
import { createImageResponse, getImageParams } from '~/utils/image.server'
import { getConvertedImageStream } from '~/utils/sharp.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { userId } = params

  // Fetch updatedAt first for cache validation (avoid loading blob if not needed)
  const image = await prisma.userImage.findUnique({
    select: { blob: true, contentType: true, updatedAt: true },
    where: { id: userId },
  })

  if (image === null) {
    throw new Response('Obrázek nebyl nalezen', { status: 404 })
  }

  // Generate ETag from URL + updatedAt timestamp (invalidates when image changes)
  const tag = getContentHash(`${request.url}:${image.updatedAt.valueOf()}`)
  const lastModified = image.updatedAt.toUTCString()

  // Check if client has cached version
  const cachedResponse = checkCacheValidation(request, tag, lastModified)
  if (cachedResponse !== null) return cachedResponse

  // Client doesn't have cached version - generate and return image
  const { width, height, quality, format } = getImageParams(request)

  const convertedImage = await getConvertedImageStream(image.blob, {
    format,
    height,
    quality,
    width,
  })

  return createImageResponse(convertedImage, userId, tag, lastModified)
}
