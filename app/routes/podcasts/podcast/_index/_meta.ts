import {
  createBreadcrumbStructuredData,
  getBreadcrumbs,
} from '~/utils/breadcrumbs'
import { createPageSEO } from '~/utils/create-page-seo'
import { getPodcastFeedMeta } from '~/utils/feeds/get-podcast-feed-meta'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, matches, location }) => {
  const podcastTitle = loaderData.podcast.title ?? 'Neznámý podcast'
  const pageSEO = createPageSEO({
    description: loaderData.podcast.description,
    // The default image until covers get a share crop.
    ogImage: resolveOgImageUrl(null, ENV.BASE_URL),
    title: `Podcasty - ${podcastTitle}`,
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })
  const breadcrumbs = getBreadcrumbs(matches)
  const breadcrumbStructuredData = createBreadcrumbStructuredData(
    breadcrumbs,
    ENV.BASE_URL,
  )

  const { podcast } = loaderData

  return [
    ...pageSEO,
    { 'script:ld+json': breadcrumbStructuredData },
    // Only a published podcast has a feed; a draft preview advertises none.
    ...(podcast.previewState === null ? getPodcastFeedMeta(podcast) : []),
  ]
}
