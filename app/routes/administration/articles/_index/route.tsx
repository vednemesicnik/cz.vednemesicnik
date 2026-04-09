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
import { Pagination } from '~/components/pagination'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { articles, canCreate, currentPage, pageSize, totalCount, totalPages } =
    loaderData

  return (
    <AdminPage>
      <AdminHeadline>Články</AdminHeadline>
      {canCreate && (
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
          {articles.map((article) => (
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
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </AdminPage>
  )
}
