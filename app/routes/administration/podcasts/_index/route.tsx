// noinspection JSUnusedGlobalSymbols

import { Form, href } from 'react-router'
import { AdminPage } from '~/components/admin/admin-page'
import {
  AdminTable,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableSelectionHeaderCell,
  useAdminTableSelection,
} from '~/components/admin/admin-table'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { ClearFiltersButton } from '~/components/clear-filters-button'
import { ClearFiltersLink } from '~/components/clear-filters-link'
import { ContentSelectionBar } from '~/components/content-selection-bar'
import { FilterBar } from '~/components/filter-bar'
import { FilterBarFilters } from '~/components/filter-bar-filters'
import { FilterBarGroup } from '~/components/filter-bar-group'
import { FilterBarSearch } from '~/components/filter-bar-search'
import { FilterCell } from '~/components/filter-cell'
import { FilterMenu } from '~/components/filter-menu'
import { ListActionBar } from '~/components/list-action-bar'
import { ListEmptyCard } from '~/components/list-empty-card'
import { ListEmptyCardText } from '~/components/list-empty-card-text'
import { ListEmptyCardTitle } from '~/components/list-empty-card-title'
import { ListHeader } from '~/components/list-header'
import { PageTitle } from '~/components/page-title'
import { Pagination } from '~/components/pagination'
import { SavedFiltersMenu } from '~/components/saved-filters-menu'
import { SavedFiltersTrigger } from '~/components/saved-filters-trigger'
import { PODCAST_BULK_NOUN } from '~/config/bulk-noun-config'
import { PODCAST_NOUN } from '~/config/list-noun-config'
import { useBulkActionResult } from '~/utils/bulk-action/use-bulk-action-result'
import { getListEmptyMessage } from '~/utils/get-list-empty-message'
import { getOptionLabels } from '~/utils/get-option-labels'
import { getSavedFilterSummary } from '~/utils/get-saved-filter-summary'
import { getStateFilter } from '~/utils/get-state-filter'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

// The keyed fetcher the selection bar submits through and the list reads (27a).
const BULK_ACTION_FETCHER_KEY = 'podcasts-bulk-action'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    canCreate,
    currentFilterQuery,
    currentPage,
    filters,
    isApprover,
    isContributor,
    matchingFilterId,
    ownFilters,
    pageSize,
    podcasts,
    query,
    queueCounts,
    sharedFilters,
    totalCount,
    totalPages,
  } = loaderData

  const pending = useAdminListPending()

  // A row joins the selection when the bar could apply something to it (27a).
  const selectableIds = podcasts
    .filter((podcast) => podcast.bulkActions.length > 0)
    .map((podcast) => podcast.id)
  const selection = useAdminTableSelection(selectableIds)
  useBulkActionResult({
    fetcherKey: BULK_ACTION_FETCHER_KEY,
    noun: PODCAST_BULK_NOUN,
    onClear: selection.clear,
  })
  // In the list's order: publishing spaces them by it (27a).
  const selectedPodcasts = podcasts.filter((podcast) =>
    selection.selectedIds.includes(podcast.id),
  )
  const hasSelection = selectedPodcasts.length > 0

  const states = filters.state ?? []
  const hasOtherFilters = query !== ''
  const isDefault = states.length === 0 && !hasOtherFilters

  const stateFilter = getStateFilter({
    isApprover,
    isContributor,
    noun: PODCAST_NOUN,
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

  const emptyMessage = getListEmptyMessage({
    hasOtherFilters,
    noun: PODCAST_NOUN,
    states,
  })

  // Nový podcast creates the draft and opens it (log 0020, 27e), so it posts.
  const newPodcastButton = canCreate && (
    <Form action={href('/administration/podcasts/add-podcast')} method={'post'}>
      <AuthenticityTokenInput />
      <Button type={'submit'}>Nový podcast</Button>
    </Form>
  )

  return (
    <AdminPage>
      {/* On a phone Nový podcast waits at the bottom (32c). */}
      <ListHeader>
        <PageTitle>Podcasty</PageTitle>
        {newPodcastButton}
      </ListHeader>
      <FilterCell>
        {/* The selection bar takes the filter row's place in the same cell,
            so the table does not move (22c, cioukqn6); not on a phone (22g). */}
        {hasSelection && (
          <ContentSelectionBar
            action={href('/administration/podcasts')}
            fetcherKey={BULK_ACTION_FETCHER_KEY}
            isCreator={!isApprover && !isContributor}
            noun={PODCAST_BULK_NOUN}
            onClear={selection.clear}
            records={selectedPodcasts.map((podcast) => ({
              ...podcast,
              related: {
                count: podcast.episodeCount,
                publishedCount: podcast.publishedEpisodeCount,
              },
              state: podcast.submission ?? podcast.state,
            }))}
          />
        )}
        <FilterBar replaced={hasSelection}>
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
            defaultHint={PODCAST_NOUN.defaultFilterHint}
            matchingFilterId={matchingFilterId}
            matchingFilterName={matchingFilterName}
            ownFilters={ownFilters}
            sharedFilters={sharedFilters}
            summaryLines={summaryLines}
            tableKey={'podcasts'}
          />
        </FilterBar>
      </FilterCell>
      {podcasts.length === 0 ? (
        // The table's head goes too; one sentence stands in its body (22e).
        <ListEmptyCard>
          <ListEmptyCardTitle>{emptyMessage.title}</ListEmptyCardTitle>
          {emptyMessage.text !== null && (
            <ListEmptyCardText>{emptyMessage.text}</ListEmptyCardText>
          )}
          {emptyMessage.action === 'create' && newPodcastButton}
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
              disabled={selectableIds.length === 0}
              indeterminate={selection.someSelected}
              onChange={selection.toggleAll}
            />
            <TableHeaderCell>
              <span className={'screen-reader-only'}>Obálka</span>
            </TableHeaderCell>
            <TableHeaderCell>Podcast</TableHeaderCell>
            <TableHeaderCell>Epizody</TableHeaderCell>
            <TableHeaderCell>Stav</TableHeaderCell>
            <TableHeaderCell variant={'actions'}>Akce</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {podcasts.map((podcast) => (
              <ItemRow
                isApprover={isApprover}
                key={podcast.id}
                onSelect={() => selection.toggle(podcast.id)}
                podcast={podcast}
                selected={selection.isSelected(podcast.id)}
              />
            ))}
          </TableBody>
        </AdminTable>
      )}
      <Pagination
        currentPage={currentPage}
        layout={'inline'}
        noun={PODCAST_NOUN.countForms}
        pageSize={pageSize}
        size={'sm'}
        totalCount={totalCount}
        totalPages={totalPages}
      />
      {/* Unless the empty list already offers it (22e). */}
      {canCreate && (totalCount > 0 || emptyMessage.action !== 'create') && (
        <ListActionBar>{newPodcastButton}</ListActionBar>
      )}
    </AdminPage>
  )
}
