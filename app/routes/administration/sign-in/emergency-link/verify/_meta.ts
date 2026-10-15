import { createAdminPageTitle } from '~/utils/create-admin-page-title'

import type { Route } from './+types/route'
import { getEmergencyLinkVerifyHeading } from './utils/get-emergency-link-verify-heading'

// meta cannot see actionData: after a failed confirm the title follows the
// revalidated loader, which finds the link invalid too.
export const meta: Route.MetaFunction = ({ loaderData }) => {
  const title = createAdminPageTitle(
    getEmergencyLinkVerifyHeading(loaderData?.status ?? 'invalid'),
  )

  return [{ title }]
}
