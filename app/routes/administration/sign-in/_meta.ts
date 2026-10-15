import { createAdminPageTitle } from '~/utils/create-admin-page-title'

import type { Route } from './+types/route'

// Not the heading „Přihlášení do administrace“: the title already says
// Administrace (copy lb4tnwuj).
export const meta: Route.MetaFunction = () => {
  const title = createAdminPageTitle('Přihlášení')

  return [{ title }]
}
