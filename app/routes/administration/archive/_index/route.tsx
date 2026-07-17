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
  const { canCreate, issues, q } = loaderData

  const pending = useAdminListPending()

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
        <AdminTableSearch defaultValue={q} placeholder={'Hledat čísla…'} />
        <AdminBulkActionsBar
          action={href('/administration/archive')}
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
              {q === '' ? 'Žádná čísla' : `Nic nenalezeno pro „${q}“`}
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
