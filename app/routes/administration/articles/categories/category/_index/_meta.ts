import { createPageTitle } from '~/utils/create-page-title'
import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const title = createPageTitle(
    `Administrace - Články - Kategorie - ${loaderData?.category.name ?? 'Detail'}`,
  )

  return [{ title }]
}
