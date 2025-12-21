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
import { ItemRow } from '~/routes/administration/podcasts/podcast/episodes/_index/components/item-row'
import type { Route } from './+types/route'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <AdminPage>
      <AdminHeadline>Epizody</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton
          to={href('/administration/podcasts/:podcastId/episodes/add-episode', {
            podcastId: loaderData.podcast.id,
          })}
        >
          Přidat epizodu
        </AdminLinkButton>
      )}
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>Název</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {loaderData.podcast.episodes.map((episode) => (
            <ItemRow
              canDelete={episode.canDelete}
              canEdit={episode.canEdit}
              canView={episode.canView}
              id={episode.id}
              key={episode.id}
              podcastId={loaderData.podcast.id}
              state={episode.state}
              title={episode.title}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
