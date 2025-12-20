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
import { ItemRow } from '~/routes/administration/archive/_index/components/item-row'

import type { Route } from './+types/route'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <AdminPage>
      <AdminHeadline>Archiv</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton to={href('/administration/archive/add-issue')}>
          Přidat číslo
        </AdminLinkButton>
      )}
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>Název</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {loaderData.issues.map((issue) => (
            <ItemRow
              canDelete={issue.canDelete}
              canEdit={issue.canEdit}
              canView={issue.canView}
              id={issue.id}
              key={issue.id}
              label={issue.label}
              state={issue.state}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
