import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import {
  getWebContentVisibility,
  ownArticle,
} from '~/utils/permissions/author/get-web-content-visibility.server'
import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const visibility = await getWebContentVisibility(request, ['article'])

  // The latest article and five more (design 10a).
  const articles = await prisma.article.findMany({
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
    take: 6,
    where: visibility.where('article', ownArticle),
  })

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
    latestArticle: articlesWithSources[0] ?? null,
    moreArticles: articlesWithSources.slice(1),
  }
}
