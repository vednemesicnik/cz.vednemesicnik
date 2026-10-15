import { createAdminPageTitle } from '~/utils/create-admin-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const title = createAdminPageTitle(loaderData?.podcast?.title ?? 'Podcasty')

  return [{ title }]
}
