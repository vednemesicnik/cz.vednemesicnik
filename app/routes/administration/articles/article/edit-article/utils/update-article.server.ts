import type { ContentState } from '@generated/prisma/enums'
import { createId } from '@paralleldrive/cuid2'
import type { FeaturedImage } from '~/config/featured-image-config'
import { FEATURED_IMAGE_SOURCE } from '~/config/featured-image-config'
import {
  buildArticleFeaturedImageSeo,
  resolveArticleFeaturedImageSeo,
} from '~/routes/administration/articles/utils/resolve-article-featured-image-seo.server'
import { prisma } from '~/utils/db.server'
import {
  deleteRowWithImages,
  prepareCoverReplacement,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

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
      // 1. Find images no longer in the form; their rows and files go last.
      const existingImageIds =
        existingImages?.map((existingImage) => existingImage.id) ?? []

      const removedImages = await prisma.articleImage.findMany({
        select: { id: true },
        where: { articleId, id: { notIn: existingImageIds } },
      })
      const removedImageIds = removedImages.map(({ id }) => id)

      // 2. Store new images' variants (files before the rows commit)
      const newImages = await Promise.all(
        (images ?? []).map(async ({ file, altText, description }) => {
          const id = createId()
          const meta = await storeImageVariants(id, file)
          return { ...meta, altText, description: description || null, id }
        }),
      )

      // 3. Store replaced files of existing images; the previous version's
      // files are dropped only after the transaction commits.
      const previousVersions = await prisma.articleImage.findMany({
        select: { id: true, version: true },
        where: { id: { in: existingImageIds } },
      })
      const updatedImages = await Promise.all(
        (existingImages ?? []).map(
          async ({ id, altText, description, file }) => {
            const { data, cleanup } = await prepareCoverReplacement({
              altText,
              coverId: id,
              file: file !== undefined && file.size > 0 ? file : undefined,
              previousVersion:
                previousVersions.find((previous) => previous.id === id)
                  ?.version ?? null,
            })
            return {
              cleanup,
              data: { ...data, description: description || null },
              id,
            }
          },
        ),
      )

      // 4. Determine featured image ID
      let featuredImageId: string | null = null
      if (featuredImage.source === FEATURED_IMAGE_SOURCE.EXISTING) {
        featuredImageId = featuredImage.id
      } else if (
        featuredImage.source === FEATURED_IMAGE_SOURCE.NEW &&
        newImages[featuredImage.index]
      ) {
        featuredImageId = newImages[featuredImage.index].id
      }

      // A new or replaced featured image isn't in the DB yet: build its SEO
      // URLs from the stored metadata instead of reading the row.
      const storedImages = [
        ...newImages,
        ...updatedImages.flatMap(({ id, data: { version, intrinsicWidth } }) =>
          version !== undefined && intrinsicWidth !== undefined
            ? [{ id, intrinsicWidth, version }]
            : [],
        ),
      ]
      const pendingFeaturedImage = storedImages.find(
        (image) => image.id === featuredImageId,
      )

      const { ogImageUrl, twitterImageUrl } =
        pendingFeaturedImage !== undefined
          ? await buildArticleFeaturedImageSeo({
              imageId: pendingFeaturedImage.id,
              intrinsicWidth: pendingFeaturedImage.intrinsicWidth,
              version: pendingFeaturedImage.version,
            })
          : await resolveArticleFeaturedImageSeo(featuredImageId)

      const pathname = `/articles/${slug}`

      // 5. In one transaction: all image rows, the article and its PageSEO
      // record. Store files of removed images and of replaced versions go only
      // after it commits, so a failed save leaves everything as it was.
      await deleteRowWithImages(
        async () => removedImageIds,
        () =>
          prisma.$transaction([
            prisma.articleImage.deleteMany({
              where: { id: { in: removedImageIds } },
            }),
            ...newImages.map((imageData) =>
              prisma.articleImage.create({
                data: { ...imageData, articleId },
                select: { id: true },
              }),
            ),
            ...updatedImages.map(({ id, data }) =>
              prisma.articleImage.update({ data, where: { id } }),
            ),
            prisma.article.update({
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
            }),
            prisma.pageSEO.upsert({
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
            }),
          ]),
      )

      await Promise.all(updatedImages.map(({ cleanup }) => cleanup()))

      return { id: articleId }
    },
    target: { authorIds, state },
  })

  return { id: articleId }
}
