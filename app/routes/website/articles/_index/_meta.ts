import type { MetaFunction } from 'react-router'
import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { getPageTitle } from '~/utils/get-page-title'

export const meta: MetaFunction = ({ matches }) => {
  const title = getPageTitle('Články')
  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

  return [{ title }, { 'script:ld+json': breadcrumbStructuredData }]
}
