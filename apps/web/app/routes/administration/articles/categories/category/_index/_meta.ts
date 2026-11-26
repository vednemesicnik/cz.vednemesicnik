import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const title = createAdminPageTitle(loaderData?.category.name ?? 'Rubriky')

  return [{ title }]
}
