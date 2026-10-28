import { createAdminEditPageTitle } from '~/utils/create-admin-edit-page-title'
import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import { getPodcastDisplayTitle } from '~/utils/podcast/get-podcast-display-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const title =
    loaderData === undefined
      ? createAdminPageTitle('Upravit podcast')
      : loaderData.podcast.isEmptyDraft
        ? createAdminPageTitle('Nový podcast')
        : createAdminEditPageTitle(
            getPodcastDisplayTitle(loaderData.podcast.title),
          )

  return [{ title }]
}
