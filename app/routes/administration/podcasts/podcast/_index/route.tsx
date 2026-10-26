// noinspection JSUnusedGlobalSymbols

import { useState } from 'react'
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
import { ListActionBar } from '~/components/list-action-bar'
import { ListEmptyCard } from '~/components/list-empty-card'
import { ListEmptyCardText } from '~/components/list-empty-card-text'
import { ListEmptyCardTitle } from '~/components/list-empty-card-title'
import { Pagination } from '~/components/pagination'
import { SavedFiltersMenu } from '~/components/saved-filters-menu'
import { SavedFiltersTrigger } from '~/components/saved-filters-trigger'
import { EPISODE_NOUN } from '~/config/list-noun-config'
import { useContentEvents } from '~/hooks/use-content-events'
import { getListEmptyMessage } from '~/utils/get-list-empty-message'
import { getOptionLabels } from '~/utils/get-option-labels'
import { getSavedFilterSummary } from '~/utils/get-saved-filter-summary'
import { getStateFilter } from '~/utils/get-state-filter'
import { useAdminListPending } from '~/utils/use-admin-list-pending'

import { PodcastActionDialogs } from '../../components/podcast-action-dialogs'
import { usePodcastActions } from '../../utils/use-podcast-actions'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { EpisodeRow } from './components/episode-row'
import { PodcastHeader } from './components/podcast-header'
import { PodcastHistoryDialog } from './components/podcast-history-dialog'
import { SORT_KEYS } from './sort'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

/**
 * A podcast and its episodes on one page (design 27b): the podcast's header,
 * then its episode table with the 22a filter block.
 */
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    canCreateEpisode,
    canEdit,
    episodeTable,
    isApprover,
    menu,
    podcast,
    submission,
  } = loaderData
  const {
    currentFilterQuery,
    currentPage,
    episodes,
    filters,
    hasNoEpisodes,
    isContributor,
    matchingFilterId,
    ownFilters,
    pageSize,
    query,
    queueCounts,
    sharedFilters,
    totalCount,
    totalPages,
  } = episodeTable

  // The header follows its podcast; the episode rows going live is #748.
  useContentEvents({
    filter: (event) =>
      event.entity === 'podcast' && event.entityId === podcast.id,
  })

  const actions = usePodcastActions({
    deleteRedirects: true,
    fetcherKey: `podcast-${podcast.id}`,
    podcast,
  })
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const pending = useAdminListPending()

  const deletableIds = episodes
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

  const newEpisodeHref = href(
    '/administration/podcasts/:podcastId/episodes/add-episode',
    { podcastId: podcast.id },
  )

  return (
    <AdminPage>
      <PodcastHeader
        canCreateEpisode={canCreateEpisode}
        canEdit={canEdit}
        isSubmitting={actions.isSubmitting}
        menu={menu}
        onMenuItem={(item) =>
          item === 'history' ? setIsHistoryOpen(true) : actions.runAction(item)
        }
        podcast={podcast}
        tagState={submission ?? podcast.state}
      />

      <section aria-labelledby={'episodes-heading'} className={styles.episodes}>
        <div className={styles.toolbar}>
          <h2 className={styles.heading} id={'episodes-heading'}>
            Epizody
          </h2>
          {!hasNoEpisodes && (
            <FilterCell className={styles.filters}>
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
        </div>

        {episodes.length === 0 ? (
          // The table's head goes too; one sentence stands in its body (22e, 27g).
          <ListEmptyCard>
            <ListEmptyCardTitle>{emptyMessage.title}</ListEmptyCardTitle>
            {emptyMessage.text !== null && (
              <ListEmptyCardText>{emptyMessage.text}</ListEmptyCardText>
            )}
            {emptyMessage.action === 'create' && canCreateEpisode && (
              <LinkButton to={newEpisodeHref}>Nová epizoda</LinkButton>
            )}
            {emptyMessage.action === 'clearFilters' && <ClearFiltersButton />}
          </ListEmptyCard>
        ) : (
          <AdminTable
            columnsClassName={styles.columns}
            pending={pending}
            stickyHeader={true}
          >
            <TableHeader>
              <TableSelectionHeaderCell
                checked={selection.allSelected}
                disabled={deletableIds.length === 0}
                indeterminate={selection.someSelected}
                onChange={selection.toggleAll}
              />
              <TableSortableHeaderCell
                defaultOrder={'desc'}
                defaultSort={'number'}
                sortKey={'number'}
                sortKeys={SORT_KEYS}
              >
                Číslo
              </TableSortableHeaderCell>
              <TableHeaderCell>Epizoda</TableHeaderCell>
              <TableHeaderCell>Publikováno</TableHeaderCell>
              <TableHeaderCell>Stav</TableHeaderCell>
              <TableHeaderCell variant={'actions'}>Akce</TableHeaderCell>
            </TableHeader>
            <TableBody>
              {episodes.map((episode) => (
                <EpisodeRow
                  episode={episode}
                  isApprover={isApprover}
                  key={episode.id}
                  onSelect={() => selection.toggle(episode.id)}
                  podcastId={podcast.id}
                  podcastSlug={podcast.slug}
                  selected={selection.isSelected(episode.id)}
                />
              ))}
            </TableBody>
          </AdminTable>
        )}
        {!hasNoEpisodes && (
          <Pagination
            currentPage={currentPage}
            layout={'inline'}
            noun={EPISODE_NOUN.countForms}
            pageSize={pageSize}
            size={'sm'}
            totalCount={totalCount}
            totalPages={totalPages}
          />
        )}
      </section>
      {/* On a phone Nová epizoda waits at the bottom, unless the empty list
          already offers it (32d, 22e). */}
      {canCreateEpisode &&
        (episodes.length > 0 || emptyMessage.action !== 'create') && (
          <ListActionBar>
            <LinkButton to={newEpisodeHref}>Nová epizoda</LinkButton>
          </ListActionBar>
        )}

      <PodcastActionDialogs
        actions={actions}
        canDelete={menu.includes('delete')}
        isApprover={isApprover}
        linksEpisodes={false}
      />
      {isHistoryOpen && (
        <PodcastHistoryDialog
          history={podcast.history}
          onClose={() => setIsHistoryOpen(false)}
          podcastTitle={podcast.title}
        />
      )}
    </AdminPage>
  )
}
