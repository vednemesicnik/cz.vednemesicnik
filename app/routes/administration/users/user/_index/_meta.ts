import { getPageTitle } from '~/utils/get-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const userName = loaderData?.user?.name ?? '???'
  const title = getPageTitle(`Administrace: Uživatelé - ${userName}`)

  return [{ title }]
}
