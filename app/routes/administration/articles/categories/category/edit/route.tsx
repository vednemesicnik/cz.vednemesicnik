// noinspection JSUnusedGlobalSymbols

import { href, useLocation } from 'react-router'
import { TaxonomyRecordDialog } from '../../../components/taxonomy-record-dialog'
import { CATEGORY_RECORD_COPY } from '../../category-record-copy'
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
      copy={CATEGORY_RECORD_COPY}
      defaultValue={loaderData.category}
      mode={'edit'}
      parentPath={`${href('/administration/articles/categories/:categoryId', {
        categoryId: params.categoryId,
      })}${search}`}
      publishedSlug={loaderData.publishedSlug}
    />
  )
}
