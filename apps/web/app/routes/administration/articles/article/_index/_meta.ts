import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const title = createAdminPageTitle(loaderData?.article.title ?? 'Články')

  return [{ title }]
}
