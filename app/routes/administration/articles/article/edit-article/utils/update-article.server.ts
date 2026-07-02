import type { ContentState } from '@generated/prisma/enums'
import { createId } from '@paralleldrive/cuid2'
import type { FeaturedImage } from '~/config/featured-image-config'
import { FEATURED_IMAGE_SOURCE } from '~/config/featured-image-config'
import { prisma } from '~/utils/db.server'
import {
  deleteImage,
  deleteImageVersion,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { resolveArticleFeaturedImageSeo } from '~/routes/administration/articles/utils/resolve-article-featured-image-seo.server'

type Options = {
  articleId: string
  authorIds: string[]
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
    authorIds,
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
    execute: async (context) => {
      // 1. Delete images that are not in existingImages (DB row + store files)
      const existingImageIds =
        existingImages?.map((existingImage) => existingImage.id) ?? []

      const removedImages = await prisma.articleImage.findMany({
        select: { id: true },
        where: { articleId, id: { notIn: existingImageIds } },
      })

      await prisma.articleImage.deleteMany({
        where: {
          articleId,
          id: {
            notIn: existingImageIds,
          },
        },
      })

      await Promise.all(removedImages.map(({ id }) => deleteImage(id)))

      // 2. Process and create new images (variants written before the row commits)
      let createdImages: Array<{ id: string }> = []
      if (images?.length) {
        const processedImages = await Promise.all(
          images.map(async ({ file, altText, description }) => {
            const id = createId()
            const meta = await storeImageVariants(id, file)
            return { ...meta, altText, description: description || null, id }
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
      if (existingImages?.length) {
        await Promise.all(
          existingImages.map(async ({ id, altText, description, file }) => {
            // Replace the file: store a new version, then drop the old version's
            // files. The stable id + new version yields a fresh, cache-busted URL.
            if (file !== undefined && file.size > 0) {
              const previous = await prisma.articleImage.findUnique({
                select: { version: true },
                where: { id },
              })
              const meta = await storeImageVariants(id, file)
              await prisma.articleImage.update({
                data: {
                  ...meta,
                  altText,
                  description: description || null,
                },
                where: { id },
              })
              if (previous?.version && previous.version !== meta.version) {
                await deleteImageVersion(id, previous.version)
              }
              return
            }

            // Just update metadata
            await prisma.articleImage.update({
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
          authors: {
            set: authorIds.map((id) => ({ id })),
          },
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

      const { ogImageUrl, twitterImageUrl } =
        await resolveArticleFeaturedImageSeo(featuredImageId)

      await prisma.pageSEO.upsert({
        create: {
          authorId: context.authorId,
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
    target: { authorIds, state },
  })

  return { id: articleId }
}
