// noinspection JSUnusedGlobalSymbols

import { href, useLocation } from 'react-router'
import { AdminBulkActionsBar } from '~/components/admin/admin-bulk-actions-bar'
import { AdminPage } from '~/components/admin/admin-page'
import {
  AdminTable,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableSelectionHeaderCell,
  TableSortableHeaderCell,
  useAdminTableSelection,
} from '~/components/admin/admin-table'
import { ClearFiltersButton } from '~/components/clear-filters-button'
import { ClearFiltersLink } from '~/components/clear-filters-link'
import { FilterBar } from '~/components/filter-bar'
import { FilterBarFilters } from '~/components/filter-bar-filters'
import { FilterBarGroup } from '~/components/filter-bar-group'
import { FilterBarSearch } from '~/components/filter-bar-search'
import { FilterCell } from '~/components/filter-cell'
import { FilterMenu } from '~/components/filter-menu'
import { LinkButton } from '~/components/link-button'
import { ListEmptyCard } from '~/components/list-empty-card'
import { ListEmptyCardText } from '~/components/list-empty-card-text'
import { ListEmptyCardTitle } from '~/components/list-empty-card-title'
import { ListHeader } from '~/components/list-header'
import { PageTitle } from '~/components/page-title'
import { Pagination } from '~/components/pagination'
import { SavedFiltersMenu } from '~/components/saved-filters-menu'
import { SavedFiltersTrigger } from '~/components/saved-filters-trigger'
import { CATEGORY_NOUN } from '~/config/list-noun-config'
import { useAdminNoticeToast } from '~/hooks/use-admin-notice-toast'
import { getListEmptyMessage } from '~/utils/get-list-empty-message'
import { getOptionLabels } from '~/utils/get-option-labels'
import { getSavedFilterSummary } from '~/utils/get-saved-filter-summary'
import { getStateFilter } from '~/utils/get-state-filter'
import { recentChangeTints } from '~/utils/recent-change-tints'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import { ArticlesTabs } from '../../components/articles-tabs'
import { TaxonomyItemRow } from '../../components/taxonomy-item-row'
import { RETURN_TO_OPENER_STATE } from '../../utils/return-to-opener-state'
import { CATEGORY_RECORD_COPY } from '../category-record-copy'
import type { Route } from './+types/route'
import { SORT_KEYS } from './sort'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    canCreate,
    categories,
    currentFilterQuery,
    currentPage,
    filters,
    isApprover,
    isContributor,
    matchingFilterId,
    ownFilters,
    pageSize,
    query,
    queueCounts,
    sharedFilters,
    totalCount,
    totalPages,
  } = loaderData

  const { search } = useLocation()
  useAdminNoticeToast(loaderData)
  const pending = useAdminListPending()

  const deletableIds = categories
    .filter((category) => category.canDelete)
    .map((category) => category.id)
  const selection = useAdminTableSelection(deletableIds)

  const states = filters.state ?? []
  const hasOtherFilters = query !== ''
  const isDefault = states.length === 0 && !hasOtherFilters

  const stateFilter = getStateFilter({
    isApprover,
    isContributor,
    noun: CATEGORY_NOUN,
    queueCounts,
  })

  const matchingFilterName = [...ownFilters, ...sharedFilters].find(
    (filter) => filter.id === matchingFilterId,
  )?.name

  const summaryLines = getSavedFilterSummary({
    filters: [
      {
        label: 'Stav',
        valueLabels: getOptionLabels(stateFilter.options, filters.state),
      },
    ],
    query,
  })

  const emptyMessage = getListEmptyMessage({
    hasOtherFilters,
    noun: CATEGORY_NOUN,
    states,
  })

  return (
    <AdminPage>
      <ArticlesTabs />
      <ListHeader>
        <PageTitle>Rubriky</PageTitle>
        {canCreate && (
          <LinkButton
            state={RETURN_TO_OPENER_STATE}
            to={`${href('/administration/articles/categories/new')}${search}`}
          >
            Nová rubrika
          </LinkButton>
        )}
      </ListHeader>
      <FilterCell>
        <AdminBulkActionsBar
          action={href('/administration/articles/categories')}
          onDone={selection.clear}
          selectedIds={selection.selectedIds}
        />
        <FilterBar replaced={selection.selectedIds.length > 0}>
          <FilterBarGroup>
            <FilterBarSearch
              defaultValue={query}
              placeholder={'Název nebo adresa'}
            />
            <FilterBarFilters>
              <FilterMenu
                attention={stateFilter.attention}
                clearLabel={'Vše'}
                label={'Stav'}
                name={'state'}
                options={stateFilter.options}
                selectedValues={states}
              />
              {!isDefault && <ClearFiltersLink />}
              <SavedFiltersTrigger
                matchingFilterName={matchingFilterName}
                placement={'filters'}
              />
            </FilterBarFilters>
          </FilterBarGroup>
          <SavedFiltersMenu
            currentQuery={currentFilterQuery}
            defaultHint={CATEGORY_NOUN.defaultFilterHint}
            matchingFilterId={matchingFilterId}
            matchingFilterName={matchingFilterName}
            ownFilters={ownFilters}
            sharedFilters={sharedFilters}
            summaryLines={summaryLines}
            tableKey={'article_categories'}
          />
        </FilterBar>
      </FilterCell>
      {totalCount === 0 ? (
        // The table's head goes too; one sentence stands in its body (22e).
        <ListEmptyCard>
          <ListEmptyCardTitle>{emptyMessage.title}</ListEmptyCardTitle>
          {emptyMessage.text !== null && (
            <ListEmptyCardText>{emptyMessage.text}</ListEmptyCardText>
          )}
          {emptyMessage.action === 'create' && canCreate && (
            <LinkButton
              state={RETURN_TO_OPENER_STATE}
              to={`${href('/administration/articles/categories/new')}${search}`}
            >
              Nová rubrika
            </LinkButton>
          )}
          {emptyMessage.action === 'clearFilters' && <ClearFiltersButton />}
        </ListEmptyCard>
      ) : (
        <AdminTable pending={pending} stickyHeader={true}>
          <TableHeader>
            <TableSelectionHeaderCell
              checked={selection.allSelected}
              disabled={deletableIds.length === 0}
              indeterminate={selection.someSelected}
              onChange={selection.toggleAll}
            />
            <TableSortableHeaderCell
              defaultOrder={'asc'}
              defaultSort={'name'}
              sortKey={'name'}
              sortKeys={SORT_KEYS}
            >
              Název
            </TableSortableHeaderCell>
            <TableHeaderCell>Publikované články</TableHeaderCell>
            <TableHeaderCell>Stav</TableHeaderCell>
            <TableHeaderCell variant={'actions'}>Akce</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TaxonomyItemRow
                copy={CATEGORY_RECORD_COPY}
                detailHref={href(
                  '/administration/articles/categories/:categoryId',
                  { categoryId: category.id },
                )}
                editHref={href(
                  '/administration/articles/categories/:categoryId/edit',
                  { categoryId: category.id },
                )}
                key={category.id}
                onSelect={() => selection.toggle(category.id)}
                publishedArticlesHref={`${href('/administration/articles')}?${new URLSearchParams({ category: category.slug, state: 'published' })}`}
                record={category}
                selected={selection.isSelected(category.id)}
                showSlug={true}
                tint={recentChangeTints.get(category.id)}
              />
            ))}
          </TableBody>
        </AdminTable>
      )}
      <Pagination
        currentPage={currentPage}
        layout={'inline'}
        noun={CATEGORY_NOUN.countForms}
        pageSize={pageSize}
        size={'sm'}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </AdminPage>
  )
}
