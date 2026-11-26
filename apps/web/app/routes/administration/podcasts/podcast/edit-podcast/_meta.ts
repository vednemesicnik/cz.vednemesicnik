import { createAdminEditPageTitle } from '~/utils/create-admin-edit-page-title'
import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import { getPodcastDisplayTitle } from '~/utils/podcast/get-podcast-display-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  // Without a title, the empty draft included, Podcast bez názvu (jri2vk3h).
  const title =
    loaderData === undefined
      ? createAdminPageTitle('Upravit podcast')
      : createAdminEditPageTitle(
          getPodcastDisplayTitle(loaderData.podcast.title),
        )

  return [{ title }]
}
