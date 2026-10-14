// noinspection JSUnusedGlobalSymbols

import { href, useLocation } from 'react-router'
import { NewTaxonomyRecordDialog } from '../../components/new-taxonomy-record-dialog'
import { TAG_RECORD_COPY } from '../tag-record-copy'
import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { search } = useLocation()

  return (
    <NewTaxonomyRecordDialog
      authors={loaderData.authors}
      copy={TAG_RECORD_COPY}
      parentPath={`${href('/administration/articles/tags')}${search}`}
      primaryIntent={loaderData.primaryIntent}
      selfAuthorId={loaderData.selfAuthorId}
    />
  )
}
