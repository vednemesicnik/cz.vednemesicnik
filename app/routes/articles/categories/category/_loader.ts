import type { ContentState } from '@generated/prisma/enums'
import { PAGE_PARAM } from '~/components/pagination'
import { getAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import type { Route } from './+types/route'

const PAGE_SIZE = 9

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { slug } = params

  const { isAuthenticated } = await getAuthentication(request)

  // Anonymous visitors see published content; authenticated users also see drafts.
  const visibleStates: ContentState[] = isAuthenticated
    ? ['published', 'draft']
    : ['published']

  const category = await prisma.articleCategory.findUnique({
    select: { name: true, slug: true },
    where: { slug, state: { in: visibleStates } },
  })

  if (!category) {
    throw new Response('Rubrika nenalezena', { status: 404 })
  }

  const url = new URL(request.url)
  const currentPage = Math.max(
    1,
    Number(url.searchParams.get(PAGE_PARAM) ?? '1') || 1,
  )

  const where = {
    categories: { some: { slug } },
    state: { in: visibleStates },
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
