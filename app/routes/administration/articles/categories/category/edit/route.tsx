// noinspection JSUnusedGlobalSymbols

import { href, useLocation } from 'react-router'
import { AdminPage } from '~/components/admin/admin-page'
import { PageTitle } from '~/components/page-title'
import { EditTaxonomyRecordForm } from '../../../components/edit-taxonomy-record-form'
import { CATEGORY_RECORD_COPY } from '../../category-record-copy'
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
    <AdminPage measure={'form'}>
      <PageTitle>{CATEGORY_RECORD_COPY.editTitle}</PageTitle>
      <EditTaxonomyRecordForm
        authors={loaderData.authors}
        copy={CATEGORY_RECORD_COPY}
        defaultValue={loaderData.category}
        parentPath={`${href('/administration/articles/categories/:categoryId', {
          categoryId: params.categoryId,
        })}${search}`}
        publishedSlug={loaderData.publishedSlug}
      />
    </AdminPage>
  )
}
