import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { ParentLink } from '~/components/parent-link'
import { TaxonomyPage } from '~/components/taxonomy-page'
import { TaxonomyPageKind } from '~/components/taxonomy-page-kind'
import { getParentBreadcrumb } from '~/utils/breadcrumbs'
import type { Route } from './+types/route'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  matches,
}: Route.ComponentProps) {
  const { articles, category, currentPage, pageSize, totalCount, totalPages } =
    loaderData
  const parent = getParentBreadcrumb(matches)

  return (
    <TaxonomyPage
      articles={articles}
      currentPage={currentPage}
      pageSize={pageSize}
      totalCount={totalCount}
      totalPages={totalPages}
    >
      {parent && <ParentLink to={parent.path}>{parent.label}</ParentLink>}
      <HeadlineGroup>
        <Headline>{category.name}</Headline>
        <TaxonomyPageKind previewState={category.previewState}>
          Rubrika
        </TaxonomyPageKind>
      </HeadlineGroup>
    </TaxonomyPage>
  )
}
