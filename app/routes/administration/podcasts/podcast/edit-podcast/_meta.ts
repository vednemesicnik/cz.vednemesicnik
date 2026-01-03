import { createPageTitle } from '~/utils/create-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const podcastTitle = loaderData?.podcast?.title ?? '???'
  const title = createPageTitle(
    `Administrace: Podcasty - ${podcastTitle} - Upravit podcast`,
  )

  return [{ title }]
}
