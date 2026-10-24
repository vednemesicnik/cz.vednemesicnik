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
import { ListHeader } from '~/components/list-header'
import { PageTitle } from '~/components/page-title'
import { Pagination } from '~/components/pagination'
import { SavedFiltersMenu } from '~/components/saved-filters-menu'
import { SavedFiltersTrigger } from '~/components/saved-filters-trigger'
import { VisuallyHidden } from '~/components/visually-hidden'
import { AUTHOR_COUNT_FORMS } from '~/config/list-noun-config'
import { useAccountEvents } from '~/hooks/use-account-events'
import { useContentEvents } from '~/hooks/use-content-events'
import {
  ACCOUNT_OPTIONS,
  AUTHOR_ROLE_OPTIONS,
} from '~/utils/admin-filter-options'
import { getOptionLabels } from '~/utils/get-option-labels'
import { getSavedFilterSummary } from '~/utils/get-saved-filter-summary'
import { RETURN_TO_OPENER_STATE } from '~/utils/return-to-opener-state'
import { getAuthorRoleLabel } from '~/utils/role-labels'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    authors,
    canCreate,
    currentFilterQuery,
    currentPage,
    filters,
    matchingFilterId,
    ownFilters,
    pageSize,
    query,
    sharedFilters,
    totalCount,
    totalPages,
  } = loaderData

  const pending = useAdminListPending()

  // Publikováno follows publishing anywhere; events carry no authors (log 0035).
  useContentEvents({
    filter: (event) =>
      event.entity === 'article' ||
      event.entity === 'issue' ||
      event.entity === 'podcast_episode',
  })

  // A row shows the account's e-mail and photo next to the author's.
  useAccountEvents()

  const deletableIds = authors
    .filter((author) => author.canDelete)
    .map((author) => author.id)
  const selection = useAdminTableSelection(deletableIds)

  const isDefault =
    query === '' && filters.role === undefined && filters.account === undefined

  const matchingFilterName = [...ownFilters, ...sharedFilters].find(
    (filter) => filter.id === matchingFilterId,
  )?.name

  const summaryLines = getSavedFilterSummary({
    filters: [
      {
        label: 'Autorská role',
        valueLabels: getOptionLabels(AUTHOR_ROLE_OPTIONS, filters.role),
      },
      {
        label: 'Účet',
        valueLabels: getOptionLabels(ACCOUNT_OPTIONS, filters.account),
      },
    ],
    query,
  })

  return (
    <AdminPage>
      <ListHeader>
        <PageTitle>Autoři</PageTitle>
        {canCreate && (
          <LinkButton
            state={RETURN_TO_OPENER_STATE}
            to={href('/administration/authors/new')}
          >
            Nový autor
          </LinkButton>
        )}
      </ListHeader>
      <FilterCell>
        <AdminBulkActionsBar
          action={href('/administration/authors')}
          onDone={selection.clear}
          selectedIds={selection.selectedIds}
        />
        <FilterBar replaced={selection.selectedIds.length > 0}>
          <FilterBarGroup>
            <FilterBarSearch defaultValue={query} placeholder={'Jméno'} />
            <FilterBarFilters>
              <FilterMenu
                clearLabel={'Všechny'}
                label={'Autorská role'}
                name={'role'}
                options={AUTHOR_ROLE_OPTIONS}
                selectedValues={filters.role ?? []}
              />
              <FilterMenu
                clearLabel={'Vše'}
                label={'Účet'}
                name={'account'}
                options={ACCOUNT_OPTIONS}
                selectedValues={filters.account ?? []}
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
            defaultHint={
              'Použije se při otevření seznamu autorů, pokud odkaz neobsahuje vlastní nastavení seznamu.'
            }
            matchingFilterId={matchingFilterId}
            matchingFilterName={matchingFilterName}
            ownFilters={ownFilters}
            sharedFilters={sharedFilters}
            summaryLines={summaryLines}
            tableKey={'authors'}
          />
        </FilterBar>
      </FilterCell>
      {authors.length === 0 ? (
        // Everyone sees at least their own author, so an empty list is always
        // a result of the filters (22e).
        <ListEmptyCard>
          <ListEmptyCardTitle>Nic nenalezeno</ListEmptyCardTitle>
          <ListEmptyCardText>
            Žádný autor neodpovídá nastaveným filtrům.
          </ListEmptyCardText>
          <ClearFiltersButton />
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
              defaultOrder={'asc'}
              defaultSort={'name'}
              sortKey={'name'}
              sortKeys={SORT_KEYS}
            >
              Jméno
            </TableSortableHeaderCell>
            <TableSortableHeaderCell
              defaultOrder={'asc'}
              defaultSort={'name'}
              sortKey={'role'}
              sortKeys={SORT_KEYS}
            >
              Autorská role
            </TableSortableHeaderCell>
            <TableSortableHeaderCell
              defaultOrder={'asc'}
              defaultSort={'name'}
              sortKey={'account'}
              sortKeys={SORT_KEYS}
            >
              Účet
            </TableSortableHeaderCell>
            {/* The sum covers three types, so the header says which (28a, copy 9w0473vu); no native title (jb81di02). */}
            <TableHeaderCell>
              Publikováno
              <VisuallyHidden>
                {' '}
                (Publikované články, epizody a čísla)
              </VisuallyHidden>
            </TableHeaderCell>
            <TableHeaderCell variant={'actions'}>Akce</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {authors.map((author) => (
              <ItemRow
                canCreateUser={author.canCreateUser}
                canDelete={author.canDelete}
                canUpdate={author.canUpdate}
                canView={author.canView}
                deleteBlock={author.deleteBlock}
                email={author.email}
                id={author.id}
                image={author.image}
                isAssociation={author.isAssociation}
                isOwn={author.isOwn}
                key={author.id}
                mayDelete={author.mayDelete}
                name={author.name}
                onSelect={() => selection.toggle(author.id)}
                publishedCount={author.publishedCount}
                roleName={getAuthorRoleLabel(author.role.name)}
                selected={selection.isSelected(author.id)}
              />
            ))}
          </TableBody>
        </AdminTable>
      )}
      <Pagination
        currentPage={currentPage}
        layout={'inline'}
        noun={AUTHOR_COUNT_FORMS}
        pageSize={pageSize}
        size={'sm'}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </AdminPage>
  )
}
