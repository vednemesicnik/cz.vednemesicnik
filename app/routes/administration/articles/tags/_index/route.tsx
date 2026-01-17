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
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <AdminPage>
      <AdminHeadline>Štítky</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton to={href('/administration/articles/tags/add-tag')}>
          Přidat štítek
        </AdminLinkButton>
      )}
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>Název</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {loaderData.tags.map((tag) => (
            <ItemRow
              canDelete={tag.canDelete}
              canEdit={tag.canEdit}
              canView={tag.canView}
              id={tag.id}
              key={tag.id}
              name={tag.name}
              state={tag.state}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
