import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, matches, location }) => {
  const { podcastEpisode } = loaderData
  const podcastTitle = podcastEpisode.podcast.title ?? 'Neznámý podcast'
  const episodeTitle = podcastEpisode.title ?? 'Neznámá epizoda'
  const pageSEO = createPageSEO({
    description: podcastEpisode.description,
    ogImage: resolveOgImageUrl(podcastEpisode.ogImageUrl, ENV.BASE_URL),
    title: `Podcasty - ${podcastTitle}: ${episodeTitle}`,
    // A square thumbnail fits cover art better than the 2:1 large card.
    twitterCard: 'summary',
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })
  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

  return [...pageSEO, { 'script:ld+json': breadcrumbStructuredData }]
}
