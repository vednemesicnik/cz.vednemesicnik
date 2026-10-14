import { createPageTitle } from '~/utils/create-page-title'
import { TAG_RECORD_COPY } from '../../tag-record-copy'
import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const title = createPageTitle(
    `Administrace - ${TAG_RECORD_COPY.editTitle} ${loaderData?.tag.name ?? ''}`.trim(),
  )

  return [{ title }]
}
