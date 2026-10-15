import { getAdminBoundaryPageTitle } from '~/components/admin/admin-boundary-error'
import { createAdminPageTitle } from '~/utils/create-admin-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ error, location }) => {
  const title =
    error === null || error === undefined
      ? createAdminPageTitle('Přehled')
      : getAdminBoundaryPageTitle(error, location)

  return [{ title }]
}
