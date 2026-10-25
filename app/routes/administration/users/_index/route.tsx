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
import { ListActionBar } from '~/components/list-action-bar'
import { ListEmptyCard } from '~/components/list-empty-card'
import { ListEmptyCardText } from '~/components/list-empty-card-text'
import { ListEmptyCardTitle } from '~/components/list-empty-card-title'
import { ListHeader } from '~/components/list-header'
import { PageTitle } from '~/components/page-title'
import { Pagination } from '~/components/pagination'
import { USER_COUNT_FORMS } from '~/config/list-noun-config'
import { useAccountEvents } from '~/hooks/use-account-events'
import { SEARCH_PARAM } from '~/utils/admin-list-params'
import { buildListSearch } from '~/utils/build-list-search'
import { RETURN_TO_OPENER_STATE } from '~/utils/return-to-opener-state'
import { getAuthorRoleLabel, getUserRoleLabel } from '~/utils/role-labels'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    canCreate,
    currentPage,
    now,
    pageSize,
    query,
    totalCount,
    totalPages,
    users,
  } = loaderData

  // A row shows the author's name and role next to the account's.
  useAccountEvents()

  const [searchParams] = useSearchParams()
  const pending = useAdminListPending()

  const newUserButton = canCreate && (
    <LinkButton
      state={RETURN_TO_OPENER_STATE}
      to={href('/administration/users/new')}
    >
      Nový uživatel
    </LinkButton>
  )

  return (
    <AdminPage>
      {/* On a phone Nový uživatel waits at the bottom (32f). */}
      <ListHeader foldsOnPhone={true}>
        <PageTitle>Uživatelé</PageTitle>
        {newUserButton}
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
          foldsOnPhone={true}
          pending={pending}
          stickyHeader={true}
        >
          <TableHeader>
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
              Uživatelská role
            </TableSortableHeaderCell>
            <TableSortableHeaderCell
              defaultOrder={'asc'}
              defaultSort={'name'}
              sortKey={'authorRole'}
              sortKeys={SORT_KEYS}
            >
              Autorská role
            </TableSortableHeaderCell>
            <TableHeaderCell>Poslední přihlášení</TableHeaderCell>
            <TableHeaderCell variant={'actions'}>Akce</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <ItemRow
                authorId={user.author.id}
                authorRoleName={getAuthorRoleLabel(user.author.role.name)}
                canDelete={user.canDelete}
                canUpdate={user.canUpdate}
                canView={user.canView}
                canViewAuthor={user.canViewAuthor}
                email={user.email}
                id={user.id}
                isOwn={user.isOwn}
                key={user.id}
                lastSignIn={user.lastSignIn}
                name={user.author.name}
                now={now}
                roleName={getUserRoleLabel(user.role.name)}
              />
            ))}
          </TableBody>
        </AdminTable>
      )}
      <Pagination
        currentPage={currentPage}
        layout={'inline'}
        noun={USER_COUNT_FORMS}
        pageSize={pageSize}
        size={'sm'}
        totalCount={totalCount}
        totalPages={totalPages}
      />
      {/* Also on a short list without pages (32f); the empty list offers
          only cancelling the search. */}
      {canCreate && <ListActionBar>{newUserButton}</ListActionBar>}
    </AdminPage>
  )
}
