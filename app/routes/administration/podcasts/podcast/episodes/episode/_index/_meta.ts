import { createPageTitle } from '~/utils/create-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const title = loaderData?.episode?.title
    ? createPageTitle(`Administrace: ${loaderData.episode.title}`)
    : createPageTitle('Administrace: Epizoda')

  return [{ title }]
}
