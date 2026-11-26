import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import { formatEpisodeTitle } from '~/utils/podcast-episode/format-episode-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  // The episode by its number and title, as the header shows it (27c).
  const title = createAdminPageTitle(
    loaderData?.episode === undefined
      ? 'Epizody'
      : formatEpisodeTitle(loaderData.episode),
  )

  return [{ title }]
}
