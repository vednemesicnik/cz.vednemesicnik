import { getAdminBoundaryPageTitle } from '~/components/admin/admin-boundary-error'
import { createPageTitle } from '~/utils/create-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ error, location }) => {
  const title =
    error === null || error === undefined
      ? createPageTitle('Administrace - Přehled')
      : getAdminBoundaryPageTitle(error, location)

  return [{ title }]
}
