import { getAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import type { Route } from './+types/route'

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { articleSlug } = params

  const { isAuthenticated } = await getAuthentication(request)

  const article = await prisma.article.findUnique({
    select: {
      authors: {
        select: {
          name: true,
        },
      },
      categories: {
        select: {
          name: true,
          slug: true,
        },
      },
      content: true,
      createdAt: true,
      featuredImage: {
        select: {
          ...imageSourceSelect,
          description: true,
        },
      },
      images: {
        select: {
          ...imageSourceSelect,
          description: true,
        },
      },
      publishedAt: true,
      tags: {
        select: {
          name: true,
          slug: true,
        },
      },
      title: true,
      updatedAt: true,
    },
    where: {
      slug: articleSlug,
      state: {
        in: isAuthenticated
          ? ['draft', 'published', 'archived']
          : ['published'],
      },
    },
  })

  if (!article) {
    throw new Response('Článek nenalezen', { status: 404 })
  }

  // Build HTML image sources so the components stay dumb renderers.
  const featuredImage = article.featuredImage
    ? {
        altText: article.featuredImage.altText,
        description: article.featuredImage.description,
        sources: createImageSources('article-image', article.featuredImage),
      }
    : null

  const images = article.images.map((image) => ({
    altText: image.altText,
    description: image.description,
    id: image.id,
    sources: createImageSources('article-image', image),
  }))

  return { article: { ...article, featuredImage, images } }
}
