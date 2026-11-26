import { getAdminBoundaryPageTitle } from '~/components/admin/admin-boundary-error'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ error, location }) => [
  { title: getAdminBoundaryPageTitle(error, location, null) },
]
