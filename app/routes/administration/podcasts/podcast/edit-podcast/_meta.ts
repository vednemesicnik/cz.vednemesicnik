import { getPageTitle } from '~/utils/get-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const podcastTitle = loaderData?.podcast?.title ?? '???'
  const title = getPageTitle(
    `Administrace: Podcasty - ${podcastTitle} - Upravit podcast`,
  )

  return [{ title }]
}
