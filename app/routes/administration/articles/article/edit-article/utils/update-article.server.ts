import type { ContentState } from '@generated/prisma/enums'
import { createId } from '@paralleldrive/cuid2'
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
              format: 'jpeg',
              height: 1200,
              quality: 85,
              width: 1600,
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

      // 3. Clear existing featured image
      await prisma.articleImage.updateMany({
        data: { featuredInArticleId: null },
        where: {
          articleId,
          featuredInArticleId: articleId,
        },
      })

      // 4. Set new featured image
      if (featuredImage.source === FEATURED_IMAGE_SOURCE.EXISTING) {
        await prisma.articleImage.update({
          data: { featuredInArticleId: articleId },
          where: { id: featuredImage.id },
        })
      } else if (
        featuredImage.source === FEATURED_IMAGE_SOURCE.NEW &&
        createdImages[featuredImage.index]
      ) {
        await prisma.articleImage.update({
          data: { featuredInArticleId: articleId },
          where: { id: createdImages[featuredImage.index].id },
        })
      }

      // 5. Update existing images
      if (existingImages?.length !== undefined) {
        await Promise.all(
          existingImages.map(async ({ id, altText, description, file }) => {
            // Check if file replacement is needed
            if (file !== undefined && file.size > 0) {
              const converted = await getConvertedImageStream(file, {
                format: 'jpeg',
                height: 1200,
                quality: 85,
                width: 1600,
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

      // 6. Update article
      await prisma.article.update({
        data: {
          authorId,
          categories: {
            set: categoryIds?.map((id) => ({ id })) ?? [],
          },
          content,
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

      return { id: articleId }
    },
    target: { authorId, state },
  })

  return { id: articleId }
}
