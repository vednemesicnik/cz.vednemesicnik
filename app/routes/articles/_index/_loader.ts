import { data } from 'react-router'
import type { NotFoundPageData } from '~/components/boundary-error'
import { PAGE_PARAM } from '~/components/pagination'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { isPagePastLast } from '~/utils/is-page-past-last'
import { parsePositiveIntegerParam } from '~/utils/parse-positive-integer-param'
import {
  getWebContentVisibility,
  ownArticle,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'
import { findCategoriesWithArticleCounts } from '../utils/find-categories-with-article-counts.server'
import { pickTopByArticleCount } from '../utils/pick-top-by-article-count'
import type { Route } from './+types/route'

const PAGE_SIZE = 9
const CATEGORY_ROW_SIZE = 5

export const loader = async ({ request }: Route.LoaderArgs) => {
  const visibility = await getWebContentVisibility(request, [
    'article',
    'article_category',
  ])
  const visibleArticles = visibility.where('article', ownArticle)

  const url = new URL(request.url)
  const currentPage = parsePositiveIntegerParam(url.searchParams, PAGE_PARAM, 1)

  const [articles, totalCount, categories] = await Promise.all([
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
          where: visibility.where('article_category', ownByAuthor),
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
    findCategoriesWithArticleCounts(visibility),
  ])

  const categoryLinks = pickTopByArticleCount(
    categories,
    CATEGORY_ROW_SIZE,
  ).map((category) => ({ name: category.name, slug: category.slug }))

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  if (isPagePastLast(currentPage, totalPages)) {
    const notFoundData: NotFoundPageData = { cause: 'page-past-last' }
    throw data(notFoundData, { status: 404 })
  }

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
    categoryLinks,
    currentPage,
    pageSize: PAGE_SIZE,
    totalCount,
    totalPages,
  }
}
