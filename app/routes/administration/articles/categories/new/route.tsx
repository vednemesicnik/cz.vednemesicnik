// noinspection JSUnusedGlobalSymbols

import { href, useLocation } from 'react-router'
import { NewTaxonomyRecordDialog } from '../../components/new-taxonomy-record-dialog'
import { CATEGORY_RECORD_COPY } from '../category-record-copy'
import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { search } = useLocation()

  return (
    <NewTaxonomyRecordDialog
      authors={loaderData.authors}
      copy={CATEGORY_RECORD_COPY}
      parentPath={`${href('/administration/articles/categories')}${search}`}
      primaryIntent={loaderData.primaryIntent}
      selfAuthorId={loaderData.selfAuthorId}
    />
  )
}
