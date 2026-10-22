// noinspection JSUnusedGlobalSymbols

import { href, useSearchParams } from 'react-router'
import { AdminPage } from '~/components/admin/admin-page'
import {
  AdminTable,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableSortableHeaderCell,
} from '~/components/admin/admin-table'
import { FilterBar } from '~/components/filter-bar'
import { FilterBarGroup } from '~/components/filter-bar-group'
import { FilterBarSearch } from '~/components/filter-bar-search'
import { FilterCell } from '~/components/filter-cell'
import { LinkButton } from '~/components/link-button'
import { ListEmptyCard } from '~/components/list-empty-card'
import { ListEmptyCardText } from '~/components/list-empty-card-text'
import { ListEmptyCardTitle } from '~/components/list-empty-card-title'
import { ListHeader } from '~/components/list-header'
import { PageTitle } from '~/components/page-title'
import { Pagination } from '~/components/pagination'
import { USER_COUNT_FORMS } from '~/config/list-noun-config'
import { SEARCH_PARAM } from '~/utils/admin-list-params'
import { buildListSearch } from '~/utils/build-list-search'
import { getUserRoleLabel } from '~/utils/role-labels'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { canCreate, query, users } = loaderData

  const [searchParams] = useSearchParams()
  const pending = useAdminListPending()

  return (
    <AdminPage>
      <ListHeader>
        <PageTitle>Uživatelé</PageTitle>
        {canCreate && (
          <LinkButton to={href('/administration/users/add-user')}>
            Nový uživatel
          </LinkButton>
        )}
      </ListHeader>
      {/* Only the search: no filters to save or clear (28d). */}
      <FilterCell>
        <FilterBar>
          <FilterBarGroup>
            <FilterBarSearch
              defaultValue={query}
              placeholder={'Jméno nebo e-mail'}
            />
          </FilterBarGroup>
        </FilterBar>
      </FilterCell>
      {users.length === 0 ? (
        // Everyone sees at least their own account, so an empty list is
        // always a result of the search (22e, 28d).
        <ListEmptyCard>
          <ListEmptyCardTitle>Nic nenalezeno</ListEmptyCardTitle>
          <ListEmptyCardText>
            Žádný uživatel neodpovídá hledání.
          </ListEmptyCardText>
          <LinkButton
            preventScrollReset={true}
            to={{
              search: buildListSearch(searchParams, {
                [SEARCH_PARAM]: undefined,
              }),
            }}
            variant={'outline'}
          >
            Zrušit hledání
          </LinkButton>
        </ListEmptyCard>
      ) : (
        <AdminTable
          columnsClassName={styles.columns}
          pending={pending}
          stickyHeader={true}
        >
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
            {users.map((user) => (
              <ItemRow
                canDelete={user.canDelete}
                canUpdate={user.canUpdate}
                canView={user.canView}
                createdAt={user.createdAt}
                email={user.email}
                id={user.id}
                key={user.id}
                name={user.author.name}
                roleName={getUserRoleLabel(user.role.name)}
              />
            ))}
          </TableBody>
        </AdminTable>
      )}
      <Pagination
        currentPage={1}
        layout={'inline'}
        noun={USER_COUNT_FORMS}
        pageSize={users.length}
        size={'sm'}
        totalCount={users.length}
        totalPages={1}
      />
    </AdminPage>
  )
}
