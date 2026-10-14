// noinspection JSUnusedGlobalSymbols

import { href, useLocation } from 'react-router'
import { AdminPage } from '~/components/admin/admin-page'
import { PageTitle } from '~/components/page-title'
import { NewTaxonomyRecordForm } from '../../components/new-taxonomy-record-form'
import { TAG_RECORD_COPY } from '../tag-record-copy'
import type { Route } from './+types/route'

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { search } = useLocation()

  return (
    <AdminPage>
      <PageTitle>{TAG_RECORD_COPY.newTitle}</PageTitle>
      <NewTaxonomyRecordForm
        authors={loaderData.authors}
        copy={TAG_RECORD_COPY}
        parentPath={`${href('/administration/articles/tags')}${search}`}
        primaryIntent={loaderData.primaryIntent}
        selfAuthorId={loaderData.selfAuthorId}
      />
    </AdminPage>
  )
}
