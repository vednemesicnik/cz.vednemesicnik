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
import { getAuthorRoleLabel } from '~/utils/role-labels'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

// selection + name + role + user email + createdAt + actions
const COLUMN_COUNT = 6

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { authors, canCreate, query } = loaderData

  const pending = useAdminListPending()

  const deletableIds = authors
    .filter((author) => author.canDelete)
    .map((author) => author.id)
  const selection = useAdminTableSelection(deletableIds)

  return (
    <AdminPage>
      <AdminHeadline>Autoři</AdminHeadline>
      {canCreate && (
        <AdminLinkButton to={href('/administration/authors/add-author')}>
          Přidat autora
        </AdminLinkButton>
      )}
      <AdminTableToolbar>
        <AdminTableSearch defaultValue={query} placeholder={'Hledat autory…'} />
        <AdminBulkActionsBar
          action={href('/administration/authors')}
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
            sortKey={'name'}
            sortKeys={SORT_KEYS}
          >
            Jméno
          </TableSortableHeaderCell>
          <TableSortableHeaderCell
            defaultOrder={'desc'}
            defaultSort={'createdAt'}
            sortKey={'role'}
            sortKeys={SORT_KEYS}
          >
            Role
          </TableSortableHeaderCell>
          <TableSortableHeaderCell
            defaultOrder={'desc'}
            defaultSort={'createdAt'}
            sortKey={'email'}
            sortKeys={SORT_KEYS}
          >
            E-mail uživatele
          </TableSortableHeaderCell>
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
          {authors.length === 0 ? (
            <TableEmptyRow colSpan={COLUMN_COUNT}>
              {query === '' ? 'Žádní autoři' : `Nic nenalezeno pro „${query}“`}
            </TableEmptyRow>
          ) : (
            authors.map((author) => (
              <ItemRow
                canDelete={author.canDelete}
                canUpdate={author.canUpdate}
                canView={author.canView}
                createdAt={author.createdAt}
                id={author.id}
                key={author.id}
                name={author.name}
                onSelect={() => selection.toggle(author.id)}
                roleName={getAuthorRoleLabel(author.role.name)}
                selected={selection.isSelected(author.id)}
                userEmail={author.user?.email ?? null}
              />
            ))
          )}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
