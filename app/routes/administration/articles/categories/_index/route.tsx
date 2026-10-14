// noinspection JSUnusedGlobalSymbols

import { href, useLocation, useSearchParams } from 'react-router'
import { AdminBulkActionsBar } from '~/components/admin/admin-bulk-actions-bar'
import { AdminFilterSelect } from '~/components/admin/admin-filter-select'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminSavedFilters } from '~/components/admin/admin-saved-filters'
import {
  AdminTable,
  TableBody,
  TableEmptyRow,
  TableHeader,
  TableHeaderCell,
  TableSelectionHeaderCell,
  TableSortableHeaderCell,
  useAdminTableSelection,
} from '~/components/admin/admin-table'
import { AdminTableFilters } from '~/components/admin/admin-table-filters'
import { AdminTableSearch } from '~/components/admin/admin-table-search'
import { AdminTableToolbar } from '~/components/admin/admin-table-toolbar'
import { LinkButton } from '~/components/link-button'
import { ListHeader } from '~/components/list-header'
import { PageTitle } from '~/components/page-title'
import { CONTENT_STATE_OPTIONS } from '~/utils/admin-filter-options'
import { getAdminListEmptyMessage } from '~/utils/admin-list-empty-message'
import { getPreservedFilterParams } from '~/utils/admin-list-filters'
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

// selection + name + state + createdAt + actions
const COLUMN_COUNT = 5

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    activeFilterId,
    canCreate,
    categories,
    currentFilterQuery,
    filters,
    ownFilters,
    query,
    sharedFilters,
  } = loaderData

  const [searchParams] = useSearchParams()
  const { search } = useLocation()
  const pending = useAdminListPending()

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined,
  )

  const deletableIds = categories
    .filter((category) => category.canDelete)
    .map((category) => category.id)
  const selection = useAdminTableSelection(deletableIds)

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
      <AdminTableToolbar>
        <AdminTableSearch
          defaultValue={query}
          placeholder={'Hledat rubriky…'}
        />
        <AdminBulkActionsBar
          action={href('/administration/articles/categories')}
          onDone={selection.clear}
          selectedIds={selection.selectedIds}
        />
        <AdminTableFilters
          preservedParams={getPreservedFilterParams(
            searchParams,
            'article_categories',
          )}
        >
          <AdminFilterSelect
            defaultValue={filters.state ?? ''}
            label={'Stav'}
            name={'state'}
            options={CONTENT_STATE_OPTIONS}
          />
        </AdminTableFilters>
        {/* Sibling of the filter form, never a child: its rows submit their own
            forms, which cannot be nested inside another one. */}
        <AdminSavedFilters
          activeFilterId={activeFilterId}
          currentQuery={currentFilterQuery}
          ownFilters={ownFilters}
          sharedFilters={sharedFilters}
          tableKey={'article_categories'}
        />
      </AdminTableToolbar>
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
          {categories.length === 0 ? (
            <TableEmptyRow colSpan={COLUMN_COUNT}>
              {getAdminListEmptyMessage({
                emptyLabel: 'Žádné rubriky',
                hasActiveFilters,
                query,
              })}
            </TableEmptyRow>
          ) : (
            categories.map((category) => (
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
            ))
          )}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
