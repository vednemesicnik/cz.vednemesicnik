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
import { AUTHOR_COUNT_FORMS } from '~/config/list-noun-config'
import {
  ACCOUNT_OPTIONS,
  AUTHOR_ROLE_OPTIONS,
} from '~/utils/admin-filter-options'
import { getOptionLabels } from '~/utils/get-option-labels'
import { getSavedFilterSummary } from '~/utils/get-saved-filter-summary'
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
    filters,
    matchingFilterId,
    ownFilters,
    query,
    sharedFilters,
  } = loaderData

  const pending = useAdminListPending()

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
          <LinkButton to={href('/administration/authors/add-author')}>
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
              defaultOrder={'desc'}
              defaultSort={'createdAt'}
              sortKey={'name'}
              sortKeys={SORT_KEYS}
            >
              Jméno
            </TableSortableHeaderCell>
            <TableSortableHeaderCell
              defaultOrder={'desc'}
              defaultSort={'createdAt'}
              sortKey={'role'}
              sortKeys={SORT_KEYS}
            >
              Role
            </TableSortableHeaderCell>
            <TableSortableHeaderCell
              defaultOrder={'desc'}
              defaultSort={'createdAt'}
              sortKey={'email'}
              sortKeys={SORT_KEYS}
            >
              E-mail uživatele
            </TableSortableHeaderCell>
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
            {authors.map((author) => (
              <ItemRow
                canDelete={author.canDelete}
                canUpdate={author.canUpdate}
                canView={author.canView}
                createdAt={author.createdAt}
                deleteBlock={author.deleteBlock}
                id={author.id}
                key={author.id}
                mayDelete={author.mayDelete}
                name={author.name}
                onSelect={() => selection.toggle(author.id)}
                roleName={getAuthorRoleLabel(author.role.name)}
                selected={selection.isSelected(author.id)}
                userEmail={author.user?.email ?? null}
              />
            ))}
          </TableBody>
        </AdminTable>
      )}
      <Pagination
        currentPage={1}
        layout={'inline'}
        noun={AUTHOR_COUNT_FORMS}
        pageSize={authors.length}
        size={'sm'}
        totalCount={authors.length}
        totalPages={1}
      />
    </AdminPage>
  )
}
