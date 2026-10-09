import { TaxonomyPage } from '~/components/taxonomy-page'
import { getParentBreadcrumb } from '~/utils/breadcrumbs'
import type { Route } from './+types/route'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  matches,
}: Route.ComponentProps) {
  const { articles, currentPage, pageSize, tag, totalCount, totalPages } =
    loaderData
  const parent = getParentBreadcrumb(matches)

  return (
    <TaxonomyPage
      articles={articles}
      currentPage={currentPage}
      kindLabel={'Štítek'}
      name={tag.name}
      pageSize={pageSize}
      parent={parent}
      totalCount={totalCount}
      totalPages={totalPages}
    />
  )
}
