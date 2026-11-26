import { createAdminEditPageTitle } from '~/utils/create-admin-edit-page-title'
import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import { AUTHOR_RECORD_COPY } from '../../author-record-copy'
import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const title =
    loaderData === undefined
      ? createAdminPageTitle(AUTHOR_RECORD_COPY.editTitle)
      : createAdminEditPageTitle(loaderData.author.name)

  return [{ title }]
}
