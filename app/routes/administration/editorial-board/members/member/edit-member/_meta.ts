import { createPageTitle } from '~/utils/create-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const title = createPageTitle(
    `Administrace: Redakce > Členové > ${loaderData.editorialBoardMember.fullName} - Upravit člena`,
  )

  return [{ title }]
}
