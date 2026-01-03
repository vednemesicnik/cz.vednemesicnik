import { createPageTitle } from '~/utils/create-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const authorName = loaderData?.author?.name ?? '???'
  const title = createPageTitle(`Administrace: Autoři - ${authorName}`)

  return [{ title }]
}
