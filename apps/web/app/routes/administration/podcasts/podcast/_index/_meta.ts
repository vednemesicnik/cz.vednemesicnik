import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import { getPodcastDisplayTitle } from '~/utils/podcast/get-podcast-display-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, matches }) => {
  // The podcast layout's title follows a rename made elsewhere, which this
  // page's own data leaves to its live load (22f).
  const layoutPodcast = matches[5]?.loaderData?.podcast
  const title = createAdminPageTitle(
    layoutPodcast === undefined
      ? (loaderData?.podcast?.title ?? 'Podcasty')
      : getPodcastDisplayTitle(layoutPodcast.title),
  )

  return [{ title }]
}
