import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { getPageTitle } from '~/utils/get-page-title'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ matches }) => {
  const pageTitle = getPageTitle('Podcasty')
  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

  return [{ title: pageTitle }, { 'script:ld+json': breadcrumbStructuredData }]
}
