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
import { ItemRow } from '~/routes/administration/authors/_index/components/item-row'
import { getAuthorRoleLabel } from '~/utils/role-labels'

export { loader } from './_loader'
export { meta } from './_meta'

export default function Route({ loaderData }: Route.ComponentProps) {
  return (
    <AdminPage>
      <AdminHeadline>Autoři</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton to={href('/administration/authors/add-author')}>
          Přidat autora
        </AdminLinkButton>
      )}
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>Jméno</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
          <TableHeaderCell>E-mail uživatele</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {loaderData.authors.map((author) => (
            <ItemRow
              canDelete={author.canDelete}
              canUpdate={author.canUpdate}
              canView={author.canView}
              id={author.id}
              key={author.id}
              name={author.name}
              roleName={getAuthorRoleLabel(author.role.name)}
              userEmail={author.user?.email ?? null}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
