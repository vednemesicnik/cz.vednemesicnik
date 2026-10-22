// noinspection JSUnusedGlobalSymbols

import { Form, href } from 'react-router'
import { AdminBulkActionsBar } from '~/components/admin/admin-bulk-actions-bar'
import { AdminPage } from '~/components/admin/admin-page'
import {
  AdminTable,
  TableBody,
  TableGroupHeading,
  TableHeader,
  TableHeaderCell,
  TableSelectionHeaderCell,
  TableSortableHeaderCell,
  useAdminTableSelection,
} from '~/components/admin/admin-table'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { ClearFiltersButton } from '~/components/clear-filters-button'
import { ClearFiltersLink } from '~/components/clear-filters-link'
import { FilterBar } from '~/components/filter-bar'
import { FilterBarFilters } from '~/components/filter-bar-filters'
import { FilterBarGroup } from '~/components/filter-bar-group'
import { FilterBarSearch } from '~/components/filter-bar-search'
import { FilterCell } from '~/components/filter-cell'
import { FilterMenu } from '~/components/filter-menu'
import { ListEmptyCard } from '~/components/list-empty-card'
import { ListEmptyCardText } from '~/components/list-empty-card-text'
import { ListEmptyCardTitle } from '~/components/list-empty-card-title'
import { ListHeader } from '~/components/list-header'
import { PageTitle } from '~/components/page-title'
import { Pagination } from '~/components/pagination'
import { SavedFiltersMenu } from '~/components/saved-filters-menu'
import { SavedFiltersTrigger } from '~/components/saved-filters-trigger'
import { ISSUE_NOUN } from '~/config/list-noun-config'
import { useAdminNoticeToast } from '~/hooks/use-admin-notice-toast'
import { useRevalidateAt } from '~/hooks/use-revalidate-at'
import { formatBulkDeleteToast } from '~/utils/format-bulk-delete-toast'
import { getListEmptyMessage } from '~/utils/get-list-empty-message'
import { getOptionLabels } from '~/utils/get-option-labels'
import { getSavedFilterSummary } from '~/utils/get-saved-filter-summary'
import { getStateFilter } from '~/utils/get-state-filter'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'
import { getIssueBulkDeleteConfirmation } from './utils/get-issue-bulk-delete-confirmation'
import { groupIssuesByYear } from './utils/group-issues-by-year'

// Selection, cover, Číslo, Pořadí, Stav, Akce (26a).
const COLUMN_COUNT = 6

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    canCreate,
    currentFilterQuery,
    currentPage,
    filters,
    isApprover,
    isContributor,
    issues,
    matchingFilterId,
    ownFilters,
    pageSize,
    query,
    queueCounts,
    sharedFilters,
    totalCount,
    totalPages,
    yearOptions,
  } = loaderData
  // „Číslo právě upravuje …“ after the editor of a held new draft (26i).
  useAdminNoticeToast(loaderData)
  // A hold's expiry sends no event; the list looks again then (26i).
  useRevalidateAt(issues.map((issue) => issue.heldUntil))

  const pending = useAdminListPending()

  const deletableIds = issues
    .filter((issue) => issue.canDelete)
    .map((issue) => issue.id)
  const selection = useAdminTableSelection(deletableIds)
  const selectedIssues = issues.filter((issue) =>
    selection.selectedIds.includes(issue.id),
  )

  const states = filters.state ?? []
  const hasOtherFilters = query !== '' || filters.year !== undefined
  const isDefault = states.length === 0 && !hasOtherFilters

  const stateFilter = getStateFilter({
    isApprover,
    isContributor,
    noun: ISSUE_NOUN,
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
      { label: 'Rok', valueLabels: getOptionLabels(yearOptions, filters.year) },
    ],
    query,
  })

  const emptyMessage = getListEmptyMessage({
    hasOtherFilters,
    noun: ISSUE_NOUN,
    states,
  })

  // Nové číslo creates the draft and opens it (decision 0020), so it posts.
  const renderNewIssueButton = () =>
    canCreate && (
      <Form action={href('/administration/archive/add-issue')} method={'post'}>
        <AuthenticityTokenInput />
        <Button type={'submit'}>Nové číslo</Button>
      </Form>
    )

  return (
    <AdminPage>
      <ListHeader>
        <PageTitle>Archiv</PageTitle>
        {renderNewIssueButton()}
      </ListHeader>
      <FilterCell>
        <AdminBulkActionsBar
          action={href('/administration/archive')}
          confirmation={getIssueBulkDeleteConfirmation(selectedIssues)}
          formatToast={(deletedCount) =>
            formatBulkDeleteToast(deletedCount, ISSUE_NOUN.countForms)
          }
          onDone={selection.clear}
          selectedIds={selection.selectedIds}
        />
        <FilterBar replaced={selection.selectedIds.length > 0}>
          <FilterBarGroup>
            <FilterBarSearch
              defaultValue={query}
              placeholder={'Název nebo doplněk'}
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
              <FilterMenu
                clearLabel={'Všechny'}
                label={'Rok'}
                name={'year'}
                options={yearOptions}
                selectedValues={filters.year ?? []}
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
            defaultHint={ISSUE_NOUN.defaultFilterHint}
            matchingFilterId={matchingFilterId}
            matchingFilterName={matchingFilterName}
            ownFilters={ownFilters}
            sharedFilters={sharedFilters}
            summaryLines={summaryLines}
            tableKey={'archive'}
          />
        </FilterBar>
      </FilterCell>
      {issues.length === 0 ? (
        // The table's head goes too; one sentence stands in its body (22e).
        <ListEmptyCard>
          <ListEmptyCardTitle>{emptyMessage.title}</ListEmptyCardTitle>
          {emptyMessage.text !== null && (
            <ListEmptyCardText>{emptyMessage.text}</ListEmptyCardText>
          )}
          {emptyMessage.action === 'create' && renderNewIssueButton()}
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
            <TableHeaderCell>Číslo</TableHeaderCell>
            <TableSortableHeaderCell
              defaultOrder={'desc'}
              defaultSort={'order'}
              sortKey={'order'}
              sortKeys={SORT_KEYS}
            >
              Pořadí
            </TableSortableHeaderCell>
            <TableHeaderCell>Stav</TableHeaderCell>
            <TableHeaderCell variant={'actions'}>Akce</TableHeaderCell>
          </TableHeader>
          {/* A heading over each year, again at the top of a page (26a). */}
          {groupIssuesByYear(issues).map((group) => (
            <TableBody key={group.year ?? 'none'}>
              {group.year !== null && (
                <TableGroupHeading colSpan={COLUMN_COUNT}>
                  {group.year}
                </TableGroupHeading>
              )}
              {group.issues.map((issue) => (
                <ItemRow
                  isApprover={isApprover}
                  issue={issue}
                  key={issue.id}
                  onSelect={() => selection.toggle(issue.id)}
                  selected={selection.isSelected(issue.id)}
                />
              ))}
            </TableBody>
          ))}
        </AdminTable>
      )}
      <Pagination
        currentPage={currentPage}
        layout={'inline'}
        noun={ISSUE_NOUN.countForms}
        pageSize={pageSize}
        size={'sm'}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </AdminPage>
  )
}
