import { ARTICLE_IMAGE_CONFIG } from '~/config/article-image-config'
import type { FeaturedImage } from '~/config/featured-image-config'
import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { getConvertedImageStream } from '~/utils/sharp.server'

type Options = {
  title: string
  slug: string
  content: string
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
          images: {
            create: processedImages,
          },
          slug,
          tags: {
            connect: tagIds?.map((id) => ({ id })) || [],
          },
          title,
        },
        select: { id: true, images: { select: { id: true } } },
      })

      // Set featured image if specified
      if (
        featuredImageIndex !== undefined &&
        createdArticle.images[featuredImageIndex]
      ) {
        await prisma.article.update({
          data: {
            featuredImageId: createdArticle.images[featuredImageIndex].id,
          },
          where: { id: createdArticle.id },
        })
      }

      return createdArticle
    },
    target: { authorId, state: 'draft' },
  })

  return { articleId: article.id }
}
