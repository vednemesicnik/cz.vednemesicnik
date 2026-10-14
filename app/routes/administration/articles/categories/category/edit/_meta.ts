import { createPageTitle } from '~/utils/create-page-title'
import { CATEGORY_RECORD_COPY } from '../../category-record-copy'
import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const title = createPageTitle(
    `Administrace - ${CATEGORY_RECORD_COPY.editTitle} ${loaderData?.category.name ?? ''}`.trim(),
  )

  return [{ title }]
}
