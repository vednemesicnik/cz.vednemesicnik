import { getPageTitle } from '~/utils/get-page-title'
import type { Route } from './+types/route'

export const meta = ({ data }: Route.MetaArgs) => {
  const title = getPageTitle(
    `Administrace - Články - Kategorie - ${data?.category.name ?? 'Detail'}`,
  )

  return [{ title }]
}
