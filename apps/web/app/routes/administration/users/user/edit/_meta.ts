import { createAdminEditPageTitle } from '~/utils/create-admin-edit-page-title'
import { createAdminPageTitle } from '~/utils/create-admin-page-title'

import { USER_RECORD_COPY } from '../../user-record-copy'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const title =
    loaderData === undefined
      ? createAdminPageTitle(USER_RECORD_COPY.editTitle)
      : createAdminEditPageTitle(loaderData.user.author.name)

  return [{ title }]
}
