import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, matches, location }) => {
  const pageSEO = createPageSEO({
    ogImage: resolveOgImageUrl(null, ENV.BASE_URL),
    title: loaderData?.category
      ? `Rubrika: ${loaderData.category.name}`
      : undefined,
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })
  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

  return [...pageSEO, { 'script:ld+json': breadcrumbStructuredData }]
}
