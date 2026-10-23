import type { Prisma } from '@generated/prisma/client'
import { data } from 'react-router'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { buildOgImageUrl } from '~/utils/image-store/image-url'
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

  const select = {
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
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      select: {
        ...imageSourceSelect,
        description: true,
      },
    },
    perex: true,
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
  } satisfies Prisma.ArticleSelect

  const previewId = new URL(request.url).searchParams.get('id')
  const visibleWhere = visibility.where('article', ownArticle, [
    'draft',
    'archived',
  ])

  // Only a published address is unique (log 0039): the administration's
  // preview names the article by its id, a reader gets the published one, and
  // a draft or an archived article shows to whoever may see it.
  const article =
    (previewId === null
      ? null
      : await prisma.article.findFirst({
          select,
          where: { AND: [{ id: previewId, slug: articleSlug }, visibleWhere] },
        })) ??
    (await prisma.article.findFirst({
      select,
      where: { publishedSlug: articleSlug, state: 'published' },
    })) ??
    (await prisma.article.findFirst({
      orderBy: { updatedAt: 'desc' },
      select,
      where: { AND: [{ slug: articleSlug }, visibleWhere] },
    }))

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

  // The featured image opens the gallery: the reader sees it whole only there
  // (design 12a, f5f51mnv).
  const galleryImages = article.featuredImage
    ? [
        article.featuredImage,
        ...article.images.filter(
          (image) => image.id !== article.featuredImage?.id,
        ),
      ]
    : article.images

  const images = galleryImages.map((image) => ({
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
      // The admin derives the OG crop whenever it saves a featured image.
      ogImageUrl: article.featuredImage
        ? buildOgImageUrl(
            'article-image',
            article.featuredImage.id,
            article.featuredImage.version,
          )
        : null,
      publishedAt: createFormattedDate(article.publishedAt),
    },
  }
}
