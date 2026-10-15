import { createAdminPageTitle } from '~/utils/create-admin-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = () => {
  const title = createAdminPageTitle('Nová epizoda')

  return [{ title }]
}
