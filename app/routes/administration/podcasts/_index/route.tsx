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

// selection + title + createdAt + state + actions
const COLUMN_COUNT = 5

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { canCreate, podcasts, query } = loaderData

  const pending = useAdminListPending()

  const deletableIds = podcasts
    .filter((podcast) => podcast.canDelete)
    .map((podcast) => podcast.id)
  const selection = useAdminTableSelection(deletableIds)

  return (
    <AdminPage>
      <AdminHeadline>Podcasty</AdminHeadline>
      {canCreate && (
        <AdminLinkButton to={href('/administration/podcasts/add-podcast')}>
          Přidat podcast
        </AdminLinkButton>
      )}
      <AdminTableToolbar>
        <AdminTableSearch
          defaultValue={query}
          placeholder={'Hledat podcasty…'}
        />
        <AdminBulkActionsBar
          action={href('/administration/podcasts')}
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
          {podcasts.length === 0 ? (
            <TableEmptyRow colSpan={COLUMN_COUNT}>
              {query === ''
                ? 'Žádné podcasty'
                : `Nic nenalezeno pro „${query}“`}
            </TableEmptyRow>
          ) : (
            podcasts.map((podcast) => (
              <ItemRow
                canDelete={podcast.canDelete}
                canEdit={podcast.canEdit}
                canView={podcast.canView}
                createdAt={podcast.createdAt}
                id={podcast.id}
                key={podcast.id}
                onSelect={() => selection.toggle(podcast.id)}
                selected={selection.isSelected(podcast.id)}
                state={podcast.state}
                title={podcast.title}
              />
            ))
          )}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
