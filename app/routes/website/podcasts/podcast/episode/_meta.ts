import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { getPageTitle } from '~/utils/get-page-title'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, matches }) => {
  const podcastTitle =
    loaderData.podcastEpisode.podcast.title ?? 'Neznámý podcast'
  const episodeTitle = loaderData.podcastEpisode.title ?? 'Neznámá epizoda'
  const pageTitle = getPageTitle(`Podcasty - ${podcastTitle}: ${episodeTitle}`)
  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

  return [{ title: pageTitle }, { 'script:ld+json': breadcrumbStructuredData }]
}
