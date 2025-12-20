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
import { ItemRow } from '~/routes/administration/podcasts/_index/components/item-row'

export { loader } from './_loader'
export { meta } from './_meta'

export default function Route({ loaderData }: Route.ComponentProps) {
  return (
    <AdminPage>
      <AdminHeadline>Podcasty</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton to={href('/administration/podcasts/add-podcast')}>
          Přidat podcast
        </AdminLinkButton>
      )}
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>Název</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {loaderData.podcasts.map((podcast) => (
            <ItemRow
              canDelete={podcast.canDelete}
              canEdit={podcast.canEdit}
              canView={podcast.canView}
              id={podcast.id}
              key={podcast.id}
              state={podcast.state}
              title={podcast.title}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
