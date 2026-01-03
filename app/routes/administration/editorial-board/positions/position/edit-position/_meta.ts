import { createPageTitle } from '~/utils/create-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const title = createPageTitle(
    `Administrace: Redakce > Pozice > ${loaderData.editorialBoardPosition.pluralLabel} - Upravit pozici`,
  )

  return [{ title }]
}
