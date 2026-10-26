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
import { ListHeader } from '~/components/list-header'
import { PageTitle } from '~/components/page-title'
import { Pagination } from '~/components/pagination'
import { SavedFiltersMenu } from '~/components/saved-filters-menu'
import { SavedFiltersTrigger } from '~/components/saved-filters-trigger'
import { PODCAST_NOUN } from '~/config/list-noun-config'
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

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    canCreate,
    currentFilterQuery,
    filters,
    isApprover,
    isContributor,
    matchingFilterId,
    ownFilters,
    podcasts,
    query,
    queueCounts,
    sharedFilters,
  } = loaderData

  const pending = useAdminListPending()

  const deletableIds = podcasts
    .filter((podcast) => podcast.canSelect)
    .map((podcast) => podcast.id)
  const selection = useAdminTableSelection(deletableIds)

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

  const newPodcastButton = canCreate && (
    <LinkButton to={href('/administration/podcasts/add-podcast')}>
      Nový podcast
    </LinkButton>
  )

  return (
    <AdminPage>
      {/* On a phone Nový podcast waits at the bottom (32c). */}
      <ListHeader>
        <PageTitle>Podcasty</PageTitle>
        {newPodcastButton}
      </ListHeader>
      <FilterCell>
        <AdminBulkActionsBar
          action={href('/administration/podcasts')}
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
          {emptyMessage.action === 'create' && canCreate && (
            <LinkButton to={href('/administration/podcasts/add-podcast')}>
              Nový podcast
            </LinkButton>
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
        currentPage={1}
        layout={'inline'}
        noun={PODCAST_NOUN.countForms}
        pageSize={podcasts.length}
        size={'sm'}
        totalCount={podcasts.length}
        totalPages={1}
      />
      {/* Unless the empty list already offers it (22e). */}
      {canCreate &&
        (podcasts.length > 0 || emptyMessage.action !== 'create') && (
          <ListActionBar>{newPodcastButton}</ListActionBar>
        )}
    </AdminPage>
  )
}
