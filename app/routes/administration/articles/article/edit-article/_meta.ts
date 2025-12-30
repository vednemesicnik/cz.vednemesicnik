import { getPageTitle } from '~/utils/get-page-title'
import type { Route } from './+types/route'

export const meta = (_args: Route.MetaArgs) => {
  const title = getPageTitle('Administrace - Upravit článek')

  return [{ title }]
}
