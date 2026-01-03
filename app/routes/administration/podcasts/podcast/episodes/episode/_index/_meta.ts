import { createPageTitle } from '~/utils/create-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ data }) => {
  const title = data?.episode?.title
    ? createPageTitle(`Administrace: ${data.episode.title}`)
    : createPageTitle('Administrace: Epizoda')

  return [{ title }]
}
