import { createAdminEditPageTitle } from '~/utils/create-admin-edit-page-title'
import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import { TAG_RECORD_COPY } from '../../tag-record-copy'
import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const title =
    loaderData === undefined
      ? createAdminPageTitle(TAG_RECORD_COPY.editTitle)
      : createAdminEditPageTitle(loaderData.tag.name)

  return [{ title }]
}
