import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { createPageTitle } from '~/utils/create-page-title'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, matches }) => {
  const podcastTitle =
    loaderData.podcastEpisode.podcast.title ?? 'Neznámý podcast'
  const episodeTitle = loaderData.podcastEpisode.title ?? 'Neznámá epizoda'
  const pageTitle = createPageTitle(
    `Podcasty - ${podcastTitle}: ${episodeTitle}`,
  )
  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

  return [{ title: pageTitle }, { 'script:ld+json': breadcrumbStructuredData }]
}
