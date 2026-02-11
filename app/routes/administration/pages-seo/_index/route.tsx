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
      <AdminHeadline>SEO stránek</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton to={href('/administration/pages-seo/add-page-seo')}>
          Přidat SEO stránky
        </AdminLinkButton>
      )}
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>Cesta</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {loaderData.pagesSEO.map((pageSEO) => (
            <ItemRow
              canDelete={pageSEO.canDelete}
              canEdit={pageSEO.canEdit}
              canView={pageSEO.canView}
              id={pageSEO.id}
              key={pageSEO.id}
              pathname={pageSEO.pathname}
              state={pageSEO.state}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
