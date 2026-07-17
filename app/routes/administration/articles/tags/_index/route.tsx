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

// selection + name + state + createdAt + actions
const COLUMN_COUNT = 5

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { canCreate, q, tags } = loaderData

  const pending = useAdminListPending()

  const deletableIds = tags.filter((tag) => tag.canDelete).map((tag) => tag.id)
  const selection = useAdminTableSelection(deletableIds)

  return (
    <AdminPage>
      <AdminHeadline>Štítky</AdminHeadline>
      {canCreate && (
        <AdminLinkButton to={href('/administration/articles/tags/add-tag')}>
          Přidat štítek
        </AdminLinkButton>
      )}
      <AdminTableToolbar>
        <AdminTableSearch defaultValue={q} placeholder={'Hledat štítky…'} />
        <AdminBulkActionsBar
          action={href('/administration/articles/tags')}
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
          {tags.length === 0 ? (
            <TableEmptyRow colSpan={COLUMN_COUNT}>
              {q === '' ? 'Žádné štítky' : `Nic nenalezeno pro „${q}“`}
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
                state={tag.state}
              />
            ))
          )}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
