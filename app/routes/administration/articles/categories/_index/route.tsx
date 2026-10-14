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
import { SavedFiltersMenu } from '~/components/saved-filters-menu'
import { SavedFiltersTrigger } from '~/components/saved-filters-trigger'
import { CATEGORY_NOUN } from '~/config/list-noun-config'
import { getListEmptyMessage } from '~/utils/get-list-empty-message'
import { getOptionLabels } from '~/utils/get-option-labels'
import { getSavedFilterSummary } from '~/utils/get-saved-filter-summary'
import { getStateFilter } from '~/utils/get-state-filter'
import { recentChangeTints } from '~/utils/recent-change-tints'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import { ArticlesTabs } from '../../components/articles-tabs'
import { RETURN_TO_OPENER_STATE } from '../../utils/return-to-opener-state'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    canCreate,
    categories,
    currentFilterQuery,
    filters,
    isApprover,
    isContributor,
    matchingFilterId,
    ownFilters,
    query,
    queueCounts,
    sharedFilters,
  } = loaderData

  const { search } = useLocation()
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
      {categories.length === 0 ? (
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
              defaultOrder={'desc'}
              defaultSort={'createdAt'}
              sortKey={'name'}
              sortKeys={SORT_KEYS}
            >
              Název
            </TableSortableHeaderCell>
            <TableSortableHeaderCell
              defaultOrder={'desc'}
              defaultSort={'createdAt'}
              sortKey={'createdAt'}
              sortKeys={SORT_KEYS}
            >
              Vytvořeno
            </TableSortableHeaderCell>
            <TableHeaderCell>Stav</TableHeaderCell>
            <TableHeaderCell variant={'actions'}>Akce</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <ItemRow
                canDelete={category.canDelete}
                canEdit={category.canEdit}
                canView={category.canView}
                createdAt={category.createdAt}
                id={category.id}
                key={category.id}
                name={category.name}
                onSelect={() => selection.toggle(category.id)}
                selected={selection.isSelected(category.id)}
                state={category.submission ?? category.state}
                tint={recentChangeTints.get(category.id)}
              />
            ))}
          </TableBody>
        </AdminTable>
      )}
    </AdminPage>
  )
}
