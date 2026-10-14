// noinspection JSUnusedGlobalSymbols

import { href, Outlet, useLocation, useSearchParams } from 'react-router'
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
import { DIALOG_OPENER_STATE } from '../../utils/dialog-opener-state'
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
    currentFilterQuery,
    filters,
    ownFilters,
    query,
    sharedFilters,
    tags,
  } = loaderData

  const [searchParams] = useSearchParams()
  const { search } = useLocation()
  const pending = useAdminListPending()

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined,
  )

  const deletableIds = tags.filter((tag) => tag.canDelete).map((tag) => tag.id)
  const selection = useAdminTableSelection(deletableIds)

  return (
    <AdminPage>
      <ArticlesTabs />
      <ListHeader>
        <PageTitle>Štítky</PageTitle>
        {canCreate && (
          <LinkButton
            state={DIALOG_OPENER_STATE}
            to={`${href('/administration/articles/tags/new')}${search}`}
          >
            Nový štítek
          </LinkButton>
        )}
      </ListHeader>
      <AdminTableToolbar>
        <AdminTableSearch defaultValue={query} placeholder={'Hledat štítky…'} />
        <AdminBulkActionsBar
          action={href('/administration/articles/tags')}
          onDone={selection.clear}
          selectedIds={selection.selectedIds}
        />
        <AdminTableFilters
          preservedParams={getPreservedFilterParams(
            searchParams,
            'article_tags',
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
          tableKey={'article_tags'}
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
          {tags.length === 0 ? (
            <TableEmptyRow colSpan={COLUMN_COUNT}>
              {getAdminListEmptyMessage({
                emptyLabel: 'Žádné štítky',
                hasActiveFilters,
                query,
              })}
            </TableEmptyRow>
          ) : (
            tags.map((tag) => (
              <ItemRow
                canDelete={tag.canDelete}
                canEdit={tag.canEdit}
                canView={tag.canView}
                createdAt={tag.createdAt}
                id={tag.id}
                key={tag.id}
                name={tag.name}
                onSelect={() => selection.toggle(tag.id)}
                selected={selection.isSelected(tag.id)}
                state={tag.submission ?? tag.state}
                tint={recentChangeTints.get(tag.id)}
              />
            ))
          )}
        </TableBody>
      </AdminTable>
      {/* The add dialog (/new) opens over the list (design 30a). */}
      <Outlet />
    </AdminPage>
  )
}
