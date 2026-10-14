// noinspection JSUnusedGlobalSymbols

import { href, useLocation } from 'react-router'
import { AdminPage } from '~/components/admin/admin-page'
import { PageTitle } from '~/components/page-title'
import { EditTaxonomyRecordForm } from '../../../components/edit-taxonomy-record-form'
import { TAG_RECORD_COPY } from '../../tag-record-copy'
import type { Route } from './+types/route'

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { search } = useLocation()

  return (
    <AdminPage>
      <PageTitle>{TAG_RECORD_COPY.editTitle}</PageTitle>
      <EditTaxonomyRecordForm
        authors={loaderData.authors}
        copy={TAG_RECORD_COPY}
        defaultValue={loaderData.tag}
        parentPath={`${href('/administration/articles/tags/:tagId', {
          tagId: params.tagId,
        })}${search}`}
        publishedSlug={loaderData.publishedSlug}
      />
    </AdminPage>
  )
}
