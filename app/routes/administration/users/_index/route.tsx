// noinspection JSUnusedGlobalSymbols

import { href, useSearchParams } from 'react-router'
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
  TableSortableHeaderCell,
} from '~/components/admin/admin-table'
import { AdminTableFilters } from '~/components/admin/admin-table-filters'
import { AdminTableSearch } from '~/components/admin/admin-table-search'
import { AdminTableToolbar } from '~/components/admin/admin-table-toolbar'
import { USER_ROLE_OPTIONS } from '~/utils/admin-filter-options'
import { getAdminListEmptyMessage } from '~/utils/admin-list-empty-message'
import { getPreservedFilterParams } from '~/utils/admin-list-filters'
import { getUserRoleLabel } from '~/utils/role-labels'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'

export { loader } from './_loader'
export { meta } from './_meta'

// email + name + role + createdAt + actions
const COLUMN_COUNT = 5

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    activeFilterId,
    canCreate,
    currentFilterQuery,
    filters,
    ownFilters,
    query,
    sharedFilters,
    users,
  } = loaderData

  const [searchParams] = useSearchParams()
  const pending = useAdminListPending()

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined,
  )

  return (
    <AdminPage>
      <AdminHeadline>Uživatelé</AdminHeadline>
      {canCreate && (
        <AdminLinkButton to={href('/administration/users/add-user')}>
          Přidat uživatele
        </AdminLinkButton>
      )}
      <AdminTableToolbar>
        <AdminTableSearch
          defaultValue={query}
          placeholder={'Hledat uživatele…'}
        />
        <AdminTableFilters
          preservedParams={getPreservedFilterParams(searchParams, 'users')}
        >
          <AdminFilterSelect
            defaultValue={filters.role ?? ''}
            label={'Role'}
            name={'role'}
            options={USER_ROLE_OPTIONS}
          />
        </AdminTableFilters>
        {/* Sibling of the filter form, never a child: its rows submit their own
            forms, which cannot be nested inside another one. */}
        <AdminSavedFilters
          activeFilterId={activeFilterId}
          currentQuery={currentFilterQuery}
          ownFilters={ownFilters}
          sharedFilters={sharedFilters}
          tableKey={'users'}
        />
      </AdminTableToolbar>
      <AdminTable pending={pending} stickyHeader={true}>
        <TableHeader>
          <TableSortableHeaderCell
            defaultOrder={'desc'}
            defaultSort={'createdAt'}
            sortKey={'email'}
            sortKeys={SORT_KEYS}
          >
            E-mail
          </TableSortableHeaderCell>
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
            sortKey={'createdAt'}
            sortKeys={SORT_KEYS}
          >
            Vytvořeno
          </TableSortableHeaderCell>
          <TableHeaderCell variant={'actions'}>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableEmptyRow colSpan={COLUMN_COUNT}>
              {getAdminListEmptyMessage({
                emptyLabel: 'Žádní uživatelé',
                hasActiveFilters,
                query,
              })}
            </TableEmptyRow>
          ) : (
            users.map((user) => (
              <ItemRow
                canDelete={user.canDelete}
                canUpdate={user.canUpdate}
                canView={user.canView}
                createdAt={user.createdAt}
                email={user.email}
                id={user.id}
                key={user.id}
                name={user.name}
                roleName={getUserRoleLabel(user.role.name)}
              />
            ))
          )}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
