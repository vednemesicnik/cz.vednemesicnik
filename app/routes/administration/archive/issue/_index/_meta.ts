import { getPageTitle } from '~/utils/get-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const issueLabel = loaderData?.issue?.label ?? '???'
  const title = getPageTitle(`Administrace: Archiv - ${issueLabel}`)

  return [{ title }]
}
