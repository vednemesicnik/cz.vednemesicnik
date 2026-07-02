import { createId } from '@paralleldrive/cuid2'
import type { FeaturedImage } from '~/config/featured-image-config'
import { prisma } from '~/utils/db.server'
import { buildOgImageUrl } from '~/utils/image-store/image-url'
import {
  ensureOgImage,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  title: string
  slug: string
  content: string
  excerpt?: string
  categoryIds?: string[]
  tagIds?: string[]
  authorIds: string[]
  images?: Array<{ file: File; altText: string; description?: string }>
  featuredImage: FeaturedImage
}

export async function createArticle(
  request: Request,
  {
    authorIds,
    title,
    slug,
    content,
    excerpt,
    categoryIds,
    tagIds,
    images,
    featuredImage,
  }: Options,
) {
  // Create article with all images and categories/tags
  const article = await withAuthorPermission(request, {
    action: 'create',
    entity: 'article',
    execute: async (context) => {
      const featuredImageIndex =
        featuredImage.source === 'new' ? featuredImage.index : undefined

      // Generate ids up front so variant files can be keyed by id and written to
      // the store before the row is committed (FS-before-DB ordering).
      const processedImages = await Promise.all(
        (images ?? []).map(async ({ file, altText, description }) => {
          const id = createId()
          const meta = await storeImageVariants(id, file)
          return { ...meta, altText, description: description || null, id }
        }),
      )

      const createdArticle = await prisma.article.create({
        data: {
          authors: {
            connect: authorIds.map((id) => ({ id })),
          },
          categories: {
            connect: categoryIds?.map((id) => ({ id })) || [],
          },
          content,
          excerpt: excerpt || null,
          images: {
            create: processedImages,
          },
          slug,
          tags: {
            connect: tagIds?.map((id) => ({ id })) || [],
          },
          title,
        },
        select: { id: true, state: true },
      })

      // Set featured image if specified
      let finalFeaturedImage: { id: string; version: string } | null = null
      if (
        featuredImageIndex !== undefined &&
        processedImages[featuredImageIndex]
      ) {
        const featured = processedImages[featuredImageIndex]
        finalFeaturedImage = { id: featured.id, version: featured.version }
        // Derive the OG crop only for the image that is actually featured.
        await ensureOgImage(
          featured.id,
          featured.version,
          featured.intrinsicWidth,
        )
        await prisma.article.update({
          data: {
            featuredImageId: featured.id,
          },
          where: { id: createdArticle.id },
        })
      }

      // Create PageSEO record for the article
      const pathname = `/articles/${slug}`

      // Generate og:image and twitter:image URLs if article has featured image
      let ogImageUrl: string | null = null
      let twitterImageUrl: string | null = null
      if (finalFeaturedImage) {
        ogImageUrl = buildOgImageUrl(
          'article-image',
          finalFeaturedImage.id,
          finalFeaturedImage.version,
        )
        twitterImageUrl = ogImageUrl
      }

      await prisma.pageSEO.create({
        data: {
          authorId: context.authorId,
          description: excerpt || null,
          ogImageUrl,
          pathname,
          state: createdArticle.state,
          title,
          twitterImageUrl,
        },
      })

      return createdArticle
    },
    target: { authorIds, state: 'draft' },
  })

  return { articleId: article.id }
}
