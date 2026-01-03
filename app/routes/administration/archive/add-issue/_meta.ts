import { createPageTitle } from '~/utils/create-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = () => {
  const title = createPageTitle('Administrace: Archiv - Přidat číslo')

  return [{ title }]
}
