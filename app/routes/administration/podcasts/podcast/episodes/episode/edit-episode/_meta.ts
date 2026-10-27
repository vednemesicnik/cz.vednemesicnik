import { createAdminEditPageTitle } from '~/utils/create-admin-edit-page-title'
import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import { formatEpisodeTitle } from '~/utils/podcast-episode/format-episode-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const title =
    loaderData === undefined
      ? createAdminPageTitle('Upravit epizodu')
      : loaderData.episode.isEmptyDraft
        ? createAdminPageTitle('Nová epizoda')
        : createAdminEditPageTitle(formatEpisodeTitle(loaderData.episode))

  return [{ title }]
}
