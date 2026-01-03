import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { createPageTitle } from '~/utils/create-page-title'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, matches }) => {
  const podcastTitle = loaderData.podcast.title ?? 'Neznámý podcast'
  const pageTitle = createPageTitle(`Podcasty - ${podcastTitle}`)
  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

  return [{ title: pageTitle }, { 'script:ld+json': breadcrumbStructuredData }]
}
