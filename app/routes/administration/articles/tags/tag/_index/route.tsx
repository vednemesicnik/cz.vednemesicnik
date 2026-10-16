// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'

import { useContentEvents } from '~/hooks/use-content-events'
import { TaxonomyDetail } from '../../../components/taxonomy-detail'
import { TAG_RECORD_COPY } from '../../tag-record-copy'
import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { articles, headerActions, tag } = loaderData
  const { tagId } = params

  useContentEvents({
    filter: (event) =>
      event.entity === 'article_tag' && event.entityId === tagId,
  })

  return (
    <TaxonomyDetail
      articles={articles}
      // No state filter: the list shows what the counts add up to (25b).
      articlesHref={`${href('/administration/articles')}?${new URLSearchParams({ tag: tag.slug })}`}
      copy={TAG_RECORD_COPY}
      detailHref={href('/administration/articles/tags/:tagId', { tagId })}
      editHref={href('/administration/articles/tags/:tagId/edit', { tagId })}
      headerActions={headerActions}
      record={tag}
    />
  )
}
