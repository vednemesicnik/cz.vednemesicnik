import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { getPageTitle } from '~/utils/get-page-title'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, matches }) => {
  const title = getPageTitle(
    loaderData !== undefined ? loaderData.article.title : 'Článek nenalezen',
  )
  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

  return [
    { title },
    { content: '', name: 'description' }, // TODO: add article description here
    { 'script:ld+json': breadcrumbStructuredData },
  ]
}
