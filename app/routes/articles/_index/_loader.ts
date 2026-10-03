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
} from '~/utils/permissions/author/get-web-content-visibility.server'
import type { Route } from './+types/route'

const PAGE_SIZE = 9

export const loader = async ({ request }: Route.LoaderArgs) => {
  const visibility = await getWebContentVisibility(request, ['article'])
  const visibleArticles = visibility.where('article', ownArticle)

  const url = new URL(request.url)
  const currentPage = parsePositiveIntegerParam(url.searchParams, PAGE_PARAM, 1)

  const [articles, totalCount] = await Promise.all([
    prisma.article.findMany({
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
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
      where: visibleArticles,
    }),
    prisma.article.count({
      where: visibleArticles,
    }),
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
    currentPage,
    pageSize: PAGE_SIZE,
    totalCount,
    totalPages,
  }
}
