// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { AdminBulkActionsBar } from '~/components/admin/admin-bulk-actions-bar'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { AdminPage } from '~/components/admin/admin-page'
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
import { AdminTableSearch } from '~/components/admin/admin-table-search'
import { AdminTableToolbar } from '~/components/admin/admin-table-toolbar'
import { Pagination } from '~/components/pagination'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

// selection + title + state + createdAt + actions
const COLUMN_COUNT = 5

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    articles,
    canCreate,
    currentPage,
    pageSize,
    q,
    totalCount,
    totalPages,
  } = loaderData

  const pending = useAdminListPending()

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
        <AdminTableSearch defaultValue={q} placeholder={'Hledat články…'} />
        <AdminBulkActionsBar
          action={href('/administration/articles')}
          onDone={selection.clear}
          selectedIds={selection.selectedIds}
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
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableSortableHeaderCell
            defaultOrder={'desc'}
            defaultSort={'createdAt'}
            sortKey={'createdAt'}
            sortKeys={SORT_KEYS}
          >
            Vytvořeno
          </TableSortableHeaderCell>
          <TableHeaderCell variant={'actions'}>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {articles.length === 0 ? (
            <TableEmptyRow colSpan={COLUMN_COUNT}>
              {q === '' ? 'Žádné články' : `Nic nenalezeno pro „${q}“`}
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
