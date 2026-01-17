import { ARTICLE_IMAGE_CONFIG } from '~/config/article-image-config'
import type { FeaturedImage } from '~/config/featured-image-config'
import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { getConvertedImageStream } from '~/utils/sharp.server'

type Options = {
  title: string
  slug: string
  content: string
  excerpt?: string
  categoryIds?: string[]
  tagIds?: string[]
  authorId: string
  images?: Array<{ file: File; altText: string; description?: string }>
  featuredImage: FeaturedImage
}

export async function createArticle(
  request: Request,
  {
    authorId,
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
    execute: async () => {
      const featuredImageIndex =
        featuredImage.source === 'new' ? featuredImage.index : undefined

      // Process all images
      const processedImages = await Promise.all(
        (images || []).map(async ({ file, altText, description }) => {
          const converted = await getConvertedImageStream(file, {
            format: ARTICLE_IMAGE_CONFIG.format,
            height: ARTICLE_IMAGE_CONFIG.height,
            quality: ARTICLE_IMAGE_CONFIG.quality,
            width: ARTICLE_IMAGE_CONFIG.width,
          })
          return {
            altText,
            blob: Uint8Array.from(await converted.stream.toBuffer()),
            contentType: converted.contentType,
            description: description || null,
          }
        }),
      )

      const createdArticle = await prisma.article.create({
        data: {
          authorId,
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
        select: { id: true, images: { select: { id: true } }, state: true },
      })

      // Set featured image if specified
      let finalFeaturedImageId: string | null = null
      if (
        featuredImageIndex !== undefined &&
        createdArticle.images[featuredImageIndex]
      ) {
        finalFeaturedImageId = createdArticle.images[featuredImageIndex].id
        await prisma.article.update({
          data: {
            featuredImageId: finalFeaturedImageId,
          },
          where: { id: createdArticle.id },
        })
      }

      // Create PageSEO record for the article
      const pathname = `/articles/${slug}`

      // Generate og:image and twitter:image URLs if article has featured image
      let ogImageUrl: string | null = null
      let twitterImageUrl: string | null = null
      if (finalFeaturedImageId) {
        ogImageUrl = `/resources/article-image/${finalFeaturedImageId}?width=1200&height=630`
        twitterImageUrl = `/resources/article-image/${finalFeaturedImageId}?width=1200&height=630`
      }

      await prisma.pageSEO.create({
        data: {
          authorId,
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
    target: { authorId, state: 'draft' },
  })

  return { articleId: article.id }
}
