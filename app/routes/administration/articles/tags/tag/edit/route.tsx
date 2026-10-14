// noinspection JSUnusedGlobalSymbols

import { href, useLocation } from 'react-router'
import { TaxonomyRecordDialog } from '../../../components/taxonomy-record-dialog'
import { TAG_RECORD_COPY } from '../../tag-record-copy'
import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { search } = useLocation()

  return (
    <TaxonomyRecordDialog
      authors={loaderData.authors}
      copy={TAG_RECORD_COPY}
      defaultValue={loaderData.tag}
      mode={'edit'}
      parentPath={`${href('/administration/articles/tags/:tagId', {
        tagId: params.tagId,
      })}${search}`}
      publishedSlug={loaderData.publishedSlug}
    />
  )
}
