import { createId } from '@paralleldrive/cuid2'
import type { FeaturedImage } from '~/config/featured-image-config'
import { buildArticleFeaturedImageSeo } from '~/routes/administration/articles/utils/resolve-article-featured-image-seo.server'
import { prisma } from '~/utils/db.server'
import { storeImageVariants } from '~/utils/image-store/store-image.server'
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
      const featuredImageData =
        featuredImageIndex === undefined
          ? null
          : (processedImages[featuredImageIndex] ?? null)

      if (featuredImageData) {
        await prisma.article.update({
          data: { featuredImageId: featuredImageData.id },
          where: { id: createdArticle.id },
        })
      }

      // Create PageSEO record for the article
      const pathname = `/articles/${slug}`

      // Build the OG URLs straight from the in-memory image metadata (no DB read).
      const { ogImageUrl, twitterImageUrl } = featuredImageData
        ? await buildArticleFeaturedImageSeo({
            imageId: featuredImageData.id,
            intrinsicWidth: featuredImageData.intrinsicWidth,
            version: featuredImageData.version,
          })
        : { ogImageUrl: null, twitterImageUrl: null }

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
