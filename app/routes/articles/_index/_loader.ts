import { PAGE_PARAM } from '~/components/pagination'
import { getAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import type { Route } from './+types/route'

const PAGE_SIZE = 9

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { isAuthenticated } = await getAuthentication(request)

  const url = new URL(request.url)
  const currentPage = Math.max(
    1,
    Number(url.searchParams.get(PAGE_PARAM) ?? '1') || 1,
  )

  const [articles, totalCount] = await Promise.all([
    prisma.article.findMany({
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      select: {
        authors: {
          select: {
            name: true,
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
      where: {
        state: { in: isAuthenticated ? ['published', 'draft'] : ['published'] },
      },
    }),
    prisma.article.count({
      where: {
        state: { in: isAuthenticated ? ['published', 'draft'] : ['published'] },
      },
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
  }))

  return {
    articles: articlesWithSources,
    currentPage,
    pageSize: PAGE_SIZE,
    totalCount,
    totalPages,
  }
}
