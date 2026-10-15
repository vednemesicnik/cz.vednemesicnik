import { createAdminEditPageTitle } from '~/utils/create-admin-edit-page-title'
import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const title =
    loaderData === undefined
      ? createAdminPageTitle('Upravit článek')
      : createAdminEditPageTitle(loaderData.article.title)

  return [{ title }]
}
