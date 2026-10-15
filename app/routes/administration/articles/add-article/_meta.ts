import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import type { Route } from './+types/route'

export const meta = (_args: Route.MetaArgs) => {
  const title = createAdminPageTitle('Nový článek')

  return [{ title }]
}
