import { createAdminEditPageTitle } from '~/utils/create-admin-edit-page-title'
import { createAdminPageTitle } from '~/utils/create-admin-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const title =
    loaderData === undefined
      ? createAdminPageTitle('Upravit číslo')
      : createAdminEditPageTitle(loaderData.issue.title)

  return [{ title }]
}
