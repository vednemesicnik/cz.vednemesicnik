import { createAdminEditPageTitle } from '~/utils/create-admin-edit-page-title'
import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import { formatEpisodeTitle } from '~/utils/podcast-episode/format-episode-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  // Without a title, the empty draft included, Epizoda bez názvu (jri2vk3h).
  const title =
    loaderData === undefined
      ? createAdminPageTitle('Upravit epizodu')
      : createAdminEditPageTitle(formatEpisodeTitle(loaderData.episode))

  return [{ title }]
}
