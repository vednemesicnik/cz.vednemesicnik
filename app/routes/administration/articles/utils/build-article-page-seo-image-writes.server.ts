import { prisma } from '~/utils/db.server'

import {
  buildArticleFeaturedImageSeo,
  resolveArticleFeaturedImageSeo,
} from './resolve-article-featured-image-seo.server'

type Options = {
  /** The article's address; a draft without one has no PageSEO record. */
  slug: string | null
  /**
   * The main image after the change: an id the database already has the
   * stored version of, the stored metadata of a version not committed yet, or
   * `null` for none.
   */
  featuredImage:
    | string
    | { id: string; version: string; intrinsicWidth: number }
    | null
}

/**
 * The write that points the article's sharing preview at its main image, for
 * a change that sets, clears or re-uploads it (design 24b). The OG crop is made
 * before, so the write can go into the change's transaction.
 *
 * @param options - The address and the main image after the change.
 * @returns The PageSEO write, or none for a draft without an address.
 */
export const buildArticlePageSeoImageWrites = async ({
  slug,
  featuredImage,
}: Options) => {
  if (slug === null) return []

  const { ogImageUrl, twitterImageUrl } =
    featuredImage === null || typeof featuredImage === 'string'
      ? await resolveArticleFeaturedImageSeo(featuredImage)
      : await buildArticleFeaturedImageSeo({
          imageId: featuredImage.id,
          intrinsicWidth: featuredImage.intrinsicWidth,
          version: featuredImage.version,
        })

  return [
    prisma.pageSEO.updateMany({
      data: { ogImageUrl, twitterImageUrl },
      where: { pathname: `/articles/${slug}` },
    }),
  ]
}
