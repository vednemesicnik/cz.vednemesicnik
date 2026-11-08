import { createPageSEO } from '~/utils/create-page-seo'
import { getPodcastFeedMeta } from '~/utils/feeds/get-podcast-feed-meta'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, location }) => {
  const pageSEO = createPageSEO({
    ogImage: resolveOgImageUrl(null, ENV.BASE_URL),
    title: 'Odebírat',
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })

  // Every podcast's feed; articles and the archive come from the website layout.
  return [...pageSEO, ...loaderData.podcastFeeds.flatMap(getPodcastFeedMeta)]
}
