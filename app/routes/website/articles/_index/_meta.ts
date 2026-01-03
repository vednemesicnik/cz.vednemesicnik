import type { MetaFunction } from 'react-router'
import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { createPageTitle } from '~/utils/create-page-title'

export const meta: MetaFunction = ({ matches }) => {
  const title = createPageTitle('Články')
  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

  return [{ title }, { 'script:ld+json': breadcrumbStructuredData }]
}
