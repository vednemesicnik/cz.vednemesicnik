import { data } from 'react-router'
import { PAGE_PARAM } from '~/components/pagination'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { parsePositiveIntegerParam } from '~/utils/parse-positive-integer-param'
import {
  getWebContentVisibility,
  ownArticle,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'
import type { Route } from './+types/route'

const PAGE_SIZE = 9

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { slug } = params

  const visibility = await getWebContentVisibility(request, [
    'article',
    'article_category',
  ])

  const category = await prisma.articleCategory.findUnique({
    select: { name: true, slug: true },
    where: { slug, ...visibility.where('article_category', ownByAuthor) },
  })

  if (!category) {
    throw data(null, { status: 404 })
  }

  const url = new URL(request.url)
  const currentPage = parsePositiveIntegerParam(url.searchParams, PAGE_PARAM, 1)

  const where = {
    categories: { some: { slug } },
    ...visibility.where('article', ownArticle),
  }

  const [articles, totalCount] = await Promise.all([
    prisma.article.findMany({
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      select: {
        authors: {
          select: {
            name: true,
          },
        },
        // A row on this category's page doesn't repeat its own badge (11b).
        categories: {
          select: {
            name: true,
            slug: true,
          },
          where: {
            ...visibility.where('article_category', ownByAuthor),
            slug: { not: slug },
          },
        },
        featuredImage: {
          select: imageSourceSelect,
        },
        id: true,
        publishedAt: true,
        slug: true,
        title: true,
      },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    prisma.article.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const articlesWithSources = articles.map((article) => ({
    ...article,
    featuredImage: article.featuredImage
      ? {
          altText: article.featuredImage.altText,
          sources: createImageSources('article-image', article.featuredImage),
        }
      : null,
    publishedAt: createFormattedDate(article.publishedAt),
  }))

  return {
    articles: articlesWithSources,
    category,
    currentPage,
    pageSize: PAGE_SIZE,
    totalCount,
    totalPages,
  }
}
