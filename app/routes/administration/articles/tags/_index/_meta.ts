import { createPageTitle } from '~/utils/create-page-title'
import type { Route } from './+types/route'

export const meta = (_args: Route.MetaArgs) => {
  const title = createPageTitle('Administrace - Štítky článků')

  return [{ title }]
}
