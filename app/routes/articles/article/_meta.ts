import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { createPageSEO } from '~/utils/create-page-seo'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, matches, location }) => {
  const pageSEO = createPageSEO({
    description: '', // TODO: add article description here
    title: loaderData.article.title ?? 'Neznámý článek',
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })

  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

  return [...pageSEO, { 'script:ld+json': breadcrumbStructuredData }]
}
