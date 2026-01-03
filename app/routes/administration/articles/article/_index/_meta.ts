import { createPageTitle } from '~/utils/create-page-title'
import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const title = createPageTitle(
    `Administrace - Články - ${loaderData?.article.title ?? 'Detail'}`,
  )

  return [{ title }]
}
