import { data } from 'react-router'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import {
  getWebContentVisibility,
  ownArticle,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'
import type { Route } from './+types/route'

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { articleSlug } = params

  const visibility = await getWebContentVisibility(request, [
    'article',
    'article_category',
    'article_tag',
  ])

  const article = await prisma.article.findUnique({
    select: {
      authors: {
        select: {
          name: true,
        },
      },
      // Only taxonomy whose own page opens for this reader (design 25d).
      categories: {
        select: {
          name: true,
          slug: true,
        },
        where: visibility.where('article_category', ownByAuthor),
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
        where: visibility.where('article_tag', ownByAuthor),
      },
      title: true,
      updatedAt: true,
    },
    where: {
      slug: articleSlug,
      ...visibility.where('article', ownArticle, ['draft', 'archived']),
    },
  })

  if (!article) {
    throw data(null, { status: 404 })
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

  return {
    article: {
      ...article,
      featuredImage,
      images,
      publishedAt: createFormattedDate(article.publishedAt),
    },
  }
}
