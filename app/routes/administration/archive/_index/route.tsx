// noinspection JSUnusedGlobalSymbols

import { href, useSearchParams } from 'react-router'
import { AdminBulkActionsBar } from '~/components/admin/admin-bulk-actions-bar'
import { AdminFilterSelect } from '~/components/admin/admin-filter-select'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
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
import { CONTENT_STATE_OPTIONS } from '~/utils/admin-filter-options'
import { getAdminListEmptyMessage } from '~/utils/admin-list-empty-message'
import { getPreservedFilterParams } from '~/utils/admin-list-filters'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

// selection + label + createdAt + state + actions
const COLUMN_COUNT = 5

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    activeFilterId,
    canCreate,
    currentFilterQuery,
    filters,
    issues,
    ownFilters,
    query,
    sharedFilters,
  } = loaderData

  const [searchParams] = useSearchParams()
  const pending = useAdminListPending()

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined,
  )

  const deletableIds = issues
    .filter((issue) => issue.canDelete)
    .map((issue) => issue.id)
  const selection = useAdminTableSelection(deletableIds)

  return (
    <AdminPage>
      <AdminHeadline>Archiv</AdminHeadline>
      {canCreate && (
        <AdminLinkButton to={href('/administration/archive/add-issue')}>
          Přidat číslo
        </AdminLinkButton>
      )}
      <AdminTableToolbar>
        <AdminTableSearch defaultValue={query} placeholder={'Hledat čísla…'} />
        <AdminBulkActionsBar
          action={href('/administration/archive')}
          onDone={selection.clear}
          selectedIds={selection.selectedIds}
        />
        <AdminTableFilters
          preservedParams={getPreservedFilterParams(searchParams, 'archive')}
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
          tableKey={'archive'}
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
            sortKey={'label'}
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
          {issues.length === 0 ? (
            <TableEmptyRow colSpan={COLUMN_COUNT}>
              {getAdminListEmptyMessage({
                emptyLabel: 'Žádná čísla',
                hasActiveFilters,
                query,
              })}
            </TableEmptyRow>
          ) : (
            issues.map((issue) => (
              <ItemRow
                canDelete={issue.canDelete}
                canEdit={issue.canEdit}
                canView={issue.canView}
                createdAt={issue.createdAt}
                id={issue.id}
                key={issue.id}
                label={issue.label}
                onSelect={() => selection.toggle(issue.id)}
                selected={selection.isSelected(issue.id)}
                state={issue.state}
              />
            ))
          )}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
