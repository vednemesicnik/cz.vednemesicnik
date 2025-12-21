// noinspection JSUnusedGlobalSymbols
import { href } from 'react-router'
import { AdminHeadline } from '~/components/admin-headline'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import {
  AdminTable,
  TableBody,
  TableHeader,
  TableHeaderCell,
} from '~/components/admin-table'
import { ItemRow } from '~/routes/administration/users/_index/components/item-row'
import { getUserRoleLabel } from '~/utils/role-labels'
import type { Route } from './+types/route'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <AdminPage>
      <AdminHeadline>Uživatelé</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton to={href('/administration/users/add-user')}>
          Přidat uživatele
        </AdminLinkButton>
      )}
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>E-mail</TableHeaderCell>
          <TableHeaderCell>Uživatelské jméno</TableHeaderCell>
          <TableHeaderCell>Jméno</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {loaderData.users.map((user) => (
            <ItemRow
              canDelete={user.canDelete}
              canUpdate={user.canUpdate}
              canView={user.canView}
              email={user.email}
              id={user.id}
              key={user.id}
              name={user.name}
              roleName={getUserRoleLabel(user.role.name)}
              username={user.username}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
