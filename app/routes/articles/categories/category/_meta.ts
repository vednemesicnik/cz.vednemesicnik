import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { createPageTitle } from '~/utils/create-page-title'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, matches }) => {
  const title = createPageTitle(
    loaderData?.category ? `Rubrika: ${loaderData.category.name}` : undefined,
  )
  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

  return [{ title }, { 'script:ld+json': breadcrumbStructuredData }]
}
