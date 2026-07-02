import { prisma } from '~/utils/db.server'
import { buildOgImageUrl } from '~/utils/image-store/image-url'
import { ensureOgImage } from '~/utils/image-store/store-image.server'

// og:image + twitter:image URLs for an article's PageSEO record. Both are null
// when the article has no featured image.
export type ArticleFeaturedImageSeo = {
  ogImageUrl: string | null
  twitterImageUrl: string | null
}

type BuildArticleFeaturedImageSeoArgs = {
  imageId: string
  version: string
  intrinsicWidth: number
}

// Ensure the OG crop exists and build the social-card URLs from metadata the
// caller already has (create path — no DB round-trip).
export async function buildArticleFeaturedImageSeo({
  imageId,
  version,
  intrinsicWidth,
}: BuildArticleFeaturedImageSeoArgs): Promise<ArticleFeaturedImageSeo> {
  await ensureOgImage(imageId, version, intrinsicWidth)

  const ogImageUrl = buildOgImageUrl('article-image', imageId, version)

  return { ogImageUrl, twitterImageUrl: ogImageUrl }
}

// Resolve the social-card URLs when only the featured image id is known (update
// path): fetch its version + dimensions, then delegate to
// `buildArticleFeaturedImageSeo`. Returns nulls when there is no featured image.
export async function resolveArticleFeaturedImageSeo(
  featuredImageId: string | null,
): Promise<ArticleFeaturedImageSeo> {
  if (!featuredImageId) {
    return { ogImageUrl: null, twitterImageUrl: null }
  }

  const featuredImageData = await prisma.articleImage.findUnique({
    select: { intrinsicWidth: true, version: true },
    where: { id: featuredImageId },
  })

  if (!featuredImageData) {
    return { ogImageUrl: null, twitterImageUrl: null }
  }

  return buildArticleFeaturedImageSeo({
    imageId: featuredImageId,
    intrinsicWidth: featuredImageData.intrinsicWidth,
    version: featuredImageData.version,
  })
}
