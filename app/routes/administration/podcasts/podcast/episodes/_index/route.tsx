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

// selection + title + createdAt + state + actions
const COLUMN_COUNT = 5

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    activeFilterId,
    canCreate,
    currentFilterQuery,
    filters,
    ownFilters,
    podcast,
    query,
    sharedFilters,
  } = loaderData

  const [searchParams] = useSearchParams()
  const pending = useAdminListPending()

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined,
  )

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
        <AdminTableFilters
          preservedParams={getPreservedFilterParams(
            searchParams,
            'podcast_episodes',
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
          tableKey={'podcast_episodes'}
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
              {getAdminListEmptyMessage({
                emptyLabel: 'Žádné epizody',
                hasActiveFilters,
                query,
              })}
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
