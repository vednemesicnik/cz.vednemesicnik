import type { ContentState } from '@generated/prisma/enums'
import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { getConvertedImageStream } from '~/utils/sharp.server'

type Options = {
  articleId: string
  authorId: string
  categoryIds?: string[]
  content: string
  featuredImageId?: string
  imagesToDelete?: string[]
  newFeaturedImageIndex?: number
  newImages?: File[]
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
    featuredImageId,
    imagesToDelete,
    newFeaturedImageIndex,
    newImages,
    slug,
    state,
    tagIds,
    title,
  }: Options,
) {
  // 1. Delete marked images
  if (imagesToDelete?.length) {
    await prisma.articleImage.deleteMany({
      where: { id: { in: imagesToDelete } },
    })
  }

  // 2. Determine final featured image ID
  let finalFeaturedId = featuredImageId

  // 3. Process and create new images
  if (newImages?.length) {
    const processedNewImages = await Promise.all(
      newImages.map(async (img) => {
        const converted = await getConvertedImageStream(img, {
          format: 'jpeg',
          height: 1200,
          quality: 85,
          width: 1600,
        })
        return {
          altText: `Obrázek: ${title}`,
          blob: Uint8Array.from(await converted.stream.toBuffer()),
          contentType: converted.contentType,
        }
      }),
    )

    // Create new images
    const createdImages = await prisma.$transaction(
      processedNewImages.map((imageData) =>
        prisma.articleImage.create({
          data: {
            ...imageData,
            articleId,
          },
        }),
      ),
    )

    // If featured is from new images, get its ID
    if (
      newFeaturedImageIndex !== undefined &&
      createdImages[newFeaturedImageIndex]
    ) {
      finalFeaturedId = createdImages[newFeaturedImageIndex].id
    }
  }

  // 4. Update article
  await withAuthorPermission(request, {
    action: 'update',
    entity: 'article',
    execute: () =>
      prisma.article.update({
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
      }),
    target: { authorId, state },
  })

  // 5. Update featured image
  // First, clear any existing featured image for this article
  await prisma.articleImage.updateMany({
    data: { featuredInArticleId: null },
    where: {
      articleId,
      featuredInArticleId: articleId,
    },
  })

  // Then set the new featured image if specified
  if (finalFeaturedId) {
    await prisma.articleImage.update({
      data: { featuredInArticleId: articleId },
      where: { id: finalFeaturedId },
    })
  }

  return { id: articleId }
}
