import { getPageTitle } from '~/utils/get-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const authorName = loaderData?.author?.name ?? '???'
  const title = getPageTitle(`Administrace: Autoři - ${authorName}`)

  return [{ title }]
}
