// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { AdminPage } from '~/components/admin/admin-page'
import {
  AdminTable,
  TableBody,
  TableEmptyRow,
  TableHeader,
  TableHeaderCell,
  TableSortableHeaderCell,
} from '~/components/admin/admin-table'
import { AdminTableSearch } from '~/components/admin/admin-table-search'
import { AdminTableToolbar } from '~/components/admin/admin-table-toolbar'
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
  const { canCreate, q, users } = loaderData

  const pending = useAdminListPending()

  return (
    <AdminPage>
      <AdminHeadline>Uživatelé</AdminHeadline>
      {canCreate && (
        <AdminLinkButton to={href('/administration/users/add-user')}>
          Přidat uživatele
        </AdminLinkButton>
      )}
      <AdminTableToolbar>
        <AdminTableSearch defaultValue={q} placeholder={'Hledat uživatele…'} />
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
              {q === '' ? 'Žádní uživatelé' : `Nic nenalezeno pro „${q}“`}
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
