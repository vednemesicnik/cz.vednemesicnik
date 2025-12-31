import { checkCacheValidation } from '~/utils/cache.server'
import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'
import { createImageResponse, getImageParams } from '~/utils/image.server'
import { getConvertedImageStream } from '~/utils/sharp.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { coverId } = params

  // Fetch updatedAt first for cache validation (avoid loading blob if not needed)
  const cover = await prisma.issueCover.findUnique({
    select: { blob: true, updatedAt: true },
    where: { id: coverId },
  })

  if (cover === null) {
    throw new Response('Obrázek nebyl nalezen', { status: 404 })
  }

  // Generate ETag from URL + updatedAt timestamp (invalidates when image changes)
  const tag = getContentHash(`${request.url}:${cover.updatedAt.valueOf()}`)
  const lastModified = cover.updatedAt.toUTCString()

  // Check if client has cached version
  const cachedResponse = checkCacheValidation(request, tag, lastModified)
  if (cachedResponse !== null) return cachedResponse

  // Client doesn't have cached version - generate and return image
  const { width, height, quality, format } = getImageParams(request)

  const convertedImage = await getConvertedImageStream(cover.blob, {
    format,
    height,
    quality,
    width,
  })

  return createImageResponse(convertedImage, coverId, tag, lastModified)
}
