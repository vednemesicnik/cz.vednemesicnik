import { createPageTitle } from '~/utils/create-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const issueLabel = loaderData?.issue?.label ?? '???'
  const title = createPageTitle(
    `Administrace: Archiv - ${issueLabel} - Upravit číslo`,
  )

  return [{ title }]
}
