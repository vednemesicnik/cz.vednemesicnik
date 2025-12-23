import { getPageTitle } from '~/utils/get-page-title'
import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const title = getPageTitle(
    `Administrace - Upravit ${loaderData?.tag.name ?? 'Tag'}`,
  )

  return [{ title }]
}
