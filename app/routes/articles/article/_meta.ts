import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'
import { createArticleStructuredData } from '~/utils/structured-data/create-article-structured-data'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, matches, location }) => {
  const { article } = loaderData
  const articleUrl = new URL(location.pathname, ENV.BASE_URL).href
  const title = article.title ?? 'Neznámý článek'

  // The perex is the description; without one the tags are left out (decided
  // 2026-10-08 on #149).
  const pageSEO = createPageSEO({
    description: article.excerpt ?? undefined,
    ogImage: resolveOgImageUrl(article.ogImageUrl, ENV.BASE_URL),
    ogType: 'article',
    title,
    url: articleUrl,
  })

  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

  // No default share image here: the Article has no image of its own then.
  const articleStructuredData = createArticleStructuredData({
    authors: article.authors,
    baseUrl: ENV.BASE_URL,
    categories: article.categories,
    dateModified: article.updatedAt.toISOString(),
    datePublished: article.publishedAt.iso,
    description: article.excerpt,
    imageUrl: article.ogImageUrl
      ? resolveOgImageUrl(article.ogImageUrl, ENV.BASE_URL)
      : null,
    tags: article.tags,
    title,
    url: articleUrl,
  })

  return [
    ...pageSEO,
    ...(article.publishedAt.iso
      ? [
          {
            content: article.publishedAt.iso,
            property: 'article:published_time',
          },
        ]
      : []),
    { 'script:ld+json': breadcrumbStructuredData },
    { 'script:ld+json': articleStructuredData },
  ]
}
