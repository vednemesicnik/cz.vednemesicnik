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
import { Pagination } from '~/components/pagination'
import { contentStateConfig } from '~/config/content-state-config'
import { getPreservedFilterParams } from '~/utils/admin-list-filters'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

// selection + title + state + createdAt + actions
const COLUMN_COUNT = 5

const STATE_OPTIONS = contentStateConfig.states.map((state) => ({
  label: contentStateConfig.selectMap[state],
  value: state,
}))

// An active filter takes precedence over the search term: with both narrowing
// the list, the filter is the more likely cause of an empty result.
const getEmptyMessage = (hasActiveFilters: boolean, query: string) => {
  if (hasActiveFilters) {
    return 'Žádné výsledky pro zvolené filtry.'
  }

  return query === '' ? 'Žádné články' : `Nic nenalezeno pro „${query}“`
}

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    activeFilterId,
    articles,
    authorOptions,
    canCreate,
    categoryOptions,
    currentFilterQuery,
    currentPage,
    filters,
    ownFilters,
    pageSize,
    query,
    sharedFilters,
    tagOptions,
    totalCount,
    totalPages,
  } = loaderData

  const [searchParams] = useSearchParams()
  const pending = useAdminListPending()

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined,
  )

  const deletableIds = articles
    .filter((article) => article.canDelete)
    .map((article) => article.id)
  const selection = useAdminTableSelection(deletableIds)

  return (
    <AdminPage>
      <AdminHeadline>Články</AdminHeadline>
      {canCreate && (
        <AdminLinkButton to={href('/administration/articles/add-article')}>
          Přidat článek
        </AdminLinkButton>
      )}
      <AdminTableToolbar>
        <AdminTableSearch defaultValue={query} placeholder={'Hledat články…'} />
        <AdminBulkActionsBar
          action={href('/administration/articles')}
          onDone={selection.clear}
          selectedIds={selection.selectedIds}
        />
        <AdminTableFilters
          preservedParams={getPreservedFilterParams(searchParams, 'articles')}
        >
          <AdminFilterSelect
            defaultValue={filters.state ?? ''}
            label={'Stav'}
            name={'state'}
            options={STATE_OPTIONS}
          />
          <AdminFilterSelect
            defaultValue={filters.category ?? ''}
            label={'Kategorie'}
            name={'category'}
            options={categoryOptions}
          />
          <AdminFilterSelect
            defaultValue={filters.tag ?? ''}
            label={'Štítek'}
            name={'tag'}
            options={tagOptions}
          />
          <AdminFilterSelect
            defaultValue={filters.author ?? ''}
            label={'Autor'}
            name={'author'}
            options={authorOptions}
          />
        </AdminTableFilters>
        {/* Sibling of the filter form, never a child: its rows submit their own
            forms, which cannot be nested inside another one. */}
        <AdminSavedFilters
          activeFilterId={activeFilterId}
          currentQuery={currentFilterQuery}
          ownFilters={ownFilters}
          sharedFilters={sharedFilters}
          tableKey={'articles'}
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
            sortKey={'title'}
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
          {totalCount === 0 ? (
            <TableEmptyRow colSpan={COLUMN_COUNT}>
              {getEmptyMessage(hasActiveFilters, query)}
            </TableEmptyRow>
          ) : (
            articles.map((article) => (
              <ItemRow
                canDelete={article.canDelete}
                canEdit={article.canEdit}
                canView={article.canView}
                createdAt={article.createdAt}
                id={article.id}
                key={article.id}
                onSelect={() => selection.toggle(article.id)}
                selected={selection.isSelected(article.id)}
                state={article.state}
                title={article.title}
              />
            ))
          )}
        </TableBody>
      </AdminTable>
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </AdminPage>
  )
}
