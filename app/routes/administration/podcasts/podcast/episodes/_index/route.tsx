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
  const { canCreate, podcast, query } = loaderData

  const pending = useAdminListPending()

  const deletableIds = podcast.episodes
    .filter((episode) => episode.canDelete)
    .map((episode) => episode.id)
  const selection = useAdminTableSelection(deletableIds)

  return (
    <AdminPage>
      <AdminHeadline>Epizody</AdminHeadline>
      {canCreate && (
        <AdminLinkButton
          to={href('/administration/podcasts/:podcastId/episodes/add-episode', {
            podcastId: podcast.id,
          })}
        >
          Přidat epizodu
        </AdminLinkButton>
      )}
      <AdminTableToolbar>
        <AdminTableSearch
          defaultValue={query}
          placeholder={'Hledat epizody…'}
        />
        <AdminBulkActionsBar
          action={href('/administration/podcasts/:podcastId/episodes', {
            podcastId: podcast.id,
          })}
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
          {podcast.episodes.length === 0 ? (
            <TableEmptyRow colSpan={COLUMN_COUNT}>
              {query === '' ? 'Žádné epizody' : `Nic nenalezeno pro „${query}“`}
            </TableEmptyRow>
          ) : (
            podcast.episodes.map((episode) => (
              <ItemRow
                canDelete={episode.canDelete}
                canEdit={episode.canEdit}
                canView={episode.canView}
                createdAt={episode.createdAt}
                id={episode.id}
                key={episode.id}
                onSelect={() => selection.toggle(episode.id)}
                podcastId={podcast.id}
                selected={selection.isSelected(episode.id)}
                state={episode.state}
                title={episode.title}
              />
            ))
          )}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
