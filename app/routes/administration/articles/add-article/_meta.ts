import { getPageTitle } from '~/utils/get-page-title'
import type { Route } from './+types/route'

export const meta = (_args: Route.MetaArgs) => {
  const title = getPageTitle('Administrace - Přidat článek')

  return [{ title }]
}
