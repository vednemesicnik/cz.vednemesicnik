import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, matches, location }) => {
  const { article } = loaderData

  // The perex is the description; without one the tags are left out (decided
  // 2026-10-08 on #149).
  const pageSEO = createPageSEO({
    description: article.excerpt ?? undefined,
    ogImage: resolveOgImageUrl(article.ogImageUrl, ENV.BASE_URL),
    ogType: 'article',
    title: article.title ?? 'Neznámý článek',
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })

  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

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
  ]
}
