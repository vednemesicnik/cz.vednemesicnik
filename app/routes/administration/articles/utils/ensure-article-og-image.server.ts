import { prisma } from '~/utils/db.server'
import { ensureOgImage } from '~/utils/image-store/store-image.server'

/**
 * Makes the share crop of an article's main image, which the public article
 * page links as its `og:image` (log 0076). Does nothing when the crop exists.
 *
 * @param imageId - The stored main image, or `null` for none.
 */
export const ensureArticleOgImage = async (imageId: string | null) => {
  if (imageId === null) return

  const image = await prisma.articleImage.findUnique({
    select: { intrinsicWidth: true, version: true },
    where: { id: imageId },
  })
  if (image === null) return

  await ensureOgImage(imageId, image.version, image.intrinsicWidth)
}
