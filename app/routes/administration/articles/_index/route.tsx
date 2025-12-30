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
      <AdminHeadline>Články</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton to={href('/administration/articles/add-article')}>
          Přidat článek
        </AdminLinkButton>
      )}
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>Název</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {loaderData.articles.map((article) => (
            <ItemRow
              canDelete={article.canDelete}
              canEdit={article.canEdit}
              canView={article.canView}
              id={article.id}
              key={article.id}
              state={article.state}
              title={article.title}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
