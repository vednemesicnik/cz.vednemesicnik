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
  images?: File[]
  featuredImageIndex?: number
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
    featuredImageIndex,
  }: Options,
) {
  // Process all images
  const processedImages = await Promise.all(
    (images || []).map(async (img, index) => {
      const converted = await getConvertedImageStream(img, {
        format: 'jpeg',
        height: 1200,
        quality: 85,
        width: 1600,
      })
      return {
        altText:
          index === featuredImageIndex
            ? `Hlavní obrázek: ${title}`
            : `Obrázek: ${title}`,
        blob: Uint8Array.from(await converted.stream.toBuffer()),
        contentType: converted.contentType,
      }
    }),
  )

  // Create article with all images and categories/tags
  const article = await withAuthorPermission(request, {
    action: 'create',
    entity: 'article',
    execute: () =>
      prisma.article.create({
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
      }),
    target: { authorId, state: 'draft' },
  })

  // Set featured image if specified
  if (featuredImageIndex !== undefined && article.images[featuredImageIndex]) {
    await prisma.articleImage.update({
      data: { featuredInArticleId: article.id },
      where: { id: article.images[featuredImageIndex].id },
    })
  }

  return { articleId: article.id }
}
