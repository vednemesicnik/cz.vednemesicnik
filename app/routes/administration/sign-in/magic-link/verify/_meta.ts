import { createAdminPageTitle } from '~/utils/create-admin-page-title'

import type { Route } from './+types/route'
import { getMagicLinkVerifyHeading } from './utils/get-magic-link-verify-heading'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const title = createAdminPageTitle(
    getMagicLinkVerifyHeading(loaderData?.status ?? 'invalid'),
  )

  return [{ title }]
}
