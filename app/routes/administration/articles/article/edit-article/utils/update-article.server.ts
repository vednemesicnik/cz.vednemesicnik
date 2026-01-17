import type { ContentState } from '@generated/prisma/enums'
import { createId } from '@paralleldrive/cuid2'
import { ARTICLE_IMAGE_CONFIG } from '~/config/article-image-config'
import type { FeaturedImage } from '~/config/featured-image-config'
import { FEATURED_IMAGE_SOURCE } from '~/config/featured-image-config'
import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { getConvertedImageStream } from '~/utils/sharp.server'

type Options = {
  articleId: string
  authorId: string
  categoryIds?: string[]
  content: string
  excerpt?: string
  existingImages?: Array<{
    id: string
    altText: string
    description?: string
    file?: File
  }>
  featuredImage: FeaturedImage
  images?: Array<{ file: File; altText: string; description?: string }>
  slug: string
  state: ContentState
  tagIds?: string[]
  title: string
}

export async function updateArticle(
  request: Request,
  {
    articleId,
    authorId,
    categoryIds,
    content,
    excerpt,
    existingImages,
    featuredImage,
    images,
    slug,
    state,
    tagIds,
    title,
  }: Options,
) {
  await withAuthorPermission(request, {
    action: 'update',
    entity: 'article',
    execute: async () => {
      // 1. Delete images that are not in existingImages
      const existingImageIds =
        existingImages?.map((existingImage) => existingImage.id) ?? []

      await prisma.articleImage.deleteMany({
        where: {
          articleId,
          id: {
            notIn: existingImageIds,
          },
        },
      })

      // 2. Process and create new images
      let createdImages: Array<{ id: string }> = []
      if (images?.length !== undefined) {
        const processedImages = await Promise.all(
          images.map(async ({ file, altText, description }) => {
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

        createdImages = await prisma.$transaction(
          processedImages.map((imageData) =>
            prisma.articleImage.create({
              data: {
                ...imageData,
                articleId,
              },
              select: { id: true },
            }),
          ),
        )
      }

      // 3. Update existing images
      if (existingImages?.length !== undefined) {
        await Promise.all(
          existingImages.map(async ({ id, altText, description, file }) => {
            // Check if file replacement is needed
            if (file !== undefined && file.size > 0) {
              const converted = await getConvertedImageStream(file, {
                format: ARTICLE_IMAGE_CONFIG.format,
                height: ARTICLE_IMAGE_CONFIG.height,
                quality: ARTICLE_IMAGE_CONFIG.quality,
                width: ARTICLE_IMAGE_CONFIG.width,
              })
              return prisma.articleImage.update({
                data: {
                  altText,
                  blob: Uint8Array.from(await converted.stream.toBuffer()),
                  contentType: converted.contentType,
                  description: description || null,
                  id: createId(), // New ID forces browser to download new image
                },
                where: { id },
              })
            }

            // Just update metadata
            return prisma.articleImage.update({
              data: {
                altText,
                description: description || null,
              },
              where: { id },
            })
          }),
        )
      }

      // 4. Determine featured image ID
      let featuredImageId: string | null = null
      if (featuredImage.source === FEATURED_IMAGE_SOURCE.EXISTING) {
        featuredImageId = featuredImage.id
      } else if (
        featuredImage.source === FEATURED_IMAGE_SOURCE.NEW &&
        createdImages[featuredImage.index]
      ) {
        featuredImageId = createdImages[featuredImage.index].id
      }

      // 5. Update article
      await prisma.article.update({
        data: {
          authorId,
          categories: {
            set: categoryIds?.map((id) => ({ id })) ?? [],
          },
          content,
          excerpt: excerpt || null,
          featuredImageId,
          slug,
          state,
          tags: {
            set: tagIds?.map((id) => ({ id })) ?? [],
          },
          title,
        },
        select: { id: true },
        where: { id: articleId },
      })

      // 6. Update or create PageSEO record for the article
      const pathname = `/articles/${slug}`

      // Generate og:image and twitter:image URLs if article has featured image
      let ogImageUrl: string | null = null
      let twitterImageUrl: string | null = null
      if (featuredImageId) {
        ogImageUrl = `/resources/article-image/${featuredImageId}?width=1200&height=630`
        twitterImageUrl = `/resources/article-image/${featuredImageId}?width=1200&height=630`
      }

      await prisma.pageSEO.upsert({
        create: {
          authorId,
          description: excerpt || null,
          ogImageUrl,
          pathname,
          state,
          title,
          twitterImageUrl,
        },
        update: {
          description: excerpt || null,
          ogImageUrl,
          state,
          title,
          twitterImageUrl,
        },
        where: { pathname },
      })

      return { id: articleId }
    },
    target: { authorId, state },
  })

  return { id: articleId }
}
