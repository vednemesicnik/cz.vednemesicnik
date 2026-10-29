// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'

import { useContentEvents } from '~/hooks/use-content-events'
import { TaxonomyDetail } from '../../../components/taxonomy-detail'
import { CATEGORY_RECORD_COPY } from '../../category-record-copy'
import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { articles, category, headerActions } = loaderData
  const { categoryId } = params

  useContentEvents({
    // An article event names no category, so the page looks again on any of
    // them; a hold changes nothing this page shows.
    filter: (event) =>
      (event.entity === 'article' && event.change !== 'hold') ||
      (event.entity === 'article_category' && event.entityId === categoryId),
  })

  return (
    <TaxonomyDetail
      articles={articles}
      // No state filter: the list shows what the counts add up to (25b).
      articlesHref={`${href('/administration/articles')}?${new URLSearchParams({ category: category.slug })}`}
      copy={CATEGORY_RECORD_COPY}
      detailHref={href('/administration/articles/categories/:categoryId', {
        categoryId,
      })}
      editHref={href('/administration/articles/categories/:categoryId/edit', {
        categoryId,
      })}
      headerActions={headerActions}
      record={category}
    />
  )
}
