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
import { ItemRow } from '~/routes/administration/articles/categories/_index/components/item-row'
import type { Route } from './+types/route'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <AdminPage>
      <AdminHeadline>Kategorie</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton
          to={href('/administration/articles/categories/add-category')}
        >
          Přidat kategorii
        </AdminLinkButton>
      )}
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>Název</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {loaderData.categories.map((category) => (
            <ItemRow
              canDelete={category.canDelete}
              canEdit={category.canEdit}
              canView={category.canView}
              id={category.id}
              key={category.id}
              name={category.name}
              state={category.state}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
