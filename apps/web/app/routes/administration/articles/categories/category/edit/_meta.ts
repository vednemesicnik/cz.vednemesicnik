import { createAdminEditPageTitle } from '~/utils/create-admin-edit-page-title'
import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import { CATEGORY_RECORD_COPY } from '../../category-record-copy'
import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const title =
    loaderData === undefined
      ? createAdminPageTitle(CATEGORY_RECORD_COPY.editTitle)
      : createAdminEditPageTitle(loaderData.category.name)

  return [{ title }]
}
