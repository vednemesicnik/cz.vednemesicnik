// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { AdminBulkActionsBar } from '~/components/admin/admin-bulk-actions-bar'
import { AdminPage } from '~/components/admin/admin-page'
import {
  AdminTable,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableSelectionHeaderCell,
  TableSortableHeaderCell,
  useAdminTableSelection,
} from '~/components/admin/admin-table'
import { ClearFiltersButton } from '~/components/clear-filters-button'
import { ClearFiltersLink } from '~/components/clear-filters-link'
import { FilterBar } from '~/components/filter-bar'
import { FilterBarFilters } from '~/components/filter-bar-filters'
import { FilterBarGroup } from '~/components/filter-bar-group'
import { FilterBarSearch } from '~/components/filter-bar-search'
import { FilterCell } from '~/components/filter-cell'
import { FilterMenu } from '~/components/filter-menu'
import { LinkButton } from '~/components/link-button'
import { ListEmptyCard } from '~/components/list-empty-card'
import { ListEmptyCardText } from '~/components/list-empty-card-text'
import { ListEmptyCardTitle } from '~/components/list-empty-card-title'
import { PageTitle } from '~/components/page-title'
import { SavedFiltersMenu } from '~/components/saved-filters-menu'
import { SavedFiltersTrigger } from '~/components/saved-filters-trigger'
import { EPISODE_NOUN } from '~/config/list-noun-config'
import { getListEmptyMessage } from '~/utils/get-list-empty-message'
import { getOptionLabels } from '~/utils/get-option-labels'
import { getSavedFilterSummary } from '~/utils/get-saved-filter-summary'
import { getStateFilter } from '~/utils/get-state-filter'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    canCreate,
    currentFilterQuery,
    filters,
    hasNoEpisodes,
    isApprover,
    isContributor,
    matchingFilterId,
    ownFilters,
    podcast,
    query,
    queueCounts,
    sharedFilters,
  } = loaderData

  const pending = useAdminListPending()

  const deletableIds = podcast.episodes
    .filter((episode) => episode.canDelete)
    .map((episode) => episode.id)
  const selection = useAdminTableSelection(deletableIds)

  const states = filters.state ?? []
  const hasOtherFilters = query !== ''
  const isDefault = states.length === 0 && !hasOtherFilters

  const stateFilter = getStateFilter({
    isApprover,
    isContributor,
    noun: EPISODE_NOUN,
    queueCounts,
  })

  const matchingFilterName = [...ownFilters, ...sharedFilters].find(
    (filter) => filter.id === matchingFilterId,
  )?.name

  const summaryLines = getSavedFilterSummary({
    filters: [
      {
        label: 'Stav',
        valueLabels: getOptionLabels(stateFilter.options, filters.state),
      },
    ],
    query,
  })

  // A podcast without a single episode says so whatever is filtered, and has
  // no filters to offer (27g).
  const emptyMessage = hasNoEpisodes
    ? getListEmptyMessage({
        hasOtherFilters: false,
        noun: EPISODE_NOUN,
        states: [],
      })
    : getListEmptyMessage({ hasOtherFilters, noun: EPISODE_NOUN, states })

  return (
    <AdminPage>
      <PageTitle>Epizody</PageTitle>
      {canCreate && (
        <LinkButton
          to={href('/administration/podcasts/:podcastId/episodes/add-episode', {
            podcastId: podcast.id,
          })}
          variant={'outline'}
        >
          Nová epizoda
        </LinkButton>
      )}
      {!hasNoEpisodes && (
        <FilterCell>
          <AdminBulkActionsBar
            action={href('/administration/podcasts/:podcastId/episodes', {
              podcastId: podcast.id,
            })}
            onDone={selection.clear}
            selectedIds={selection.selectedIds}
          />
          <FilterBar replaced={selection.selectedIds.length > 0}>
            <FilterBarGroup>
              <FilterBarSearch
                defaultValue={query}
                placeholder={'Název nebo adresa'}
              />
              <FilterBarFilters>
                <FilterMenu
                  attention={stateFilter.attention}
                  clearLabel={'Vše'}
                  label={'Stav'}
                  name={'state'}
                  options={stateFilter.options}
                  selectedValues={states}
                />
                {!isDefault && <ClearFiltersLink />}
                <SavedFiltersTrigger
                  matchingFilterName={matchingFilterName}
                  placement={'filters'}
                />
              </FilterBarFilters>
            </FilterBarGroup>
            <SavedFiltersMenu
              currentQuery={currentFilterQuery}
              defaultHint={EPISODE_NOUN.defaultFilterHint}
              matchingFilterId={matchingFilterId}
              matchingFilterName={matchingFilterName}
              ownFilters={ownFilters}
              sharedFilters={sharedFilters}
              summaryLines={summaryLines}
              tableKey={'podcast_episodes'}
            />
          </FilterBar>
        </FilterCell>
      )}
      {podcast.episodes.length === 0 ? (
        // The table's head goes too; one sentence stands in its body (22e).
        <ListEmptyCard>
          <ListEmptyCardTitle>{emptyMessage.title}</ListEmptyCardTitle>
          {emptyMessage.text !== null && (
            <ListEmptyCardText>{emptyMessage.text}</ListEmptyCardText>
          )}
          {emptyMessage.action === 'create' && canCreate && (
            <LinkButton
              to={href(
                '/administration/podcasts/:podcastId/episodes/add-episode',
                {
                  podcastId: podcast.id,
                },
              )}
            >
              Nová epizoda
            </LinkButton>
          )}
          {emptyMessage.action === 'clearFilters' && <ClearFiltersButton />}
        </ListEmptyCard>
      ) : (
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
            {podcast.episodes.map((episode) => (
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
                state={episode.submission ?? episode.state}
                title={episode.title}
              />
            ))}
          </TableBody>
        </AdminTable>
      )}
    </AdminPage>
  )
}
