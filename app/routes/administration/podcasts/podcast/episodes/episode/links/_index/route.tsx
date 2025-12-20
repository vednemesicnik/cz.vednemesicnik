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
import { ItemRow } from '~/routes/administration/podcasts/podcast/episodes/episode/links/_index/components/item-row'

export { loader } from './_loader'
export { meta } from './_meta'

export default function Route({ loaderData }: Route.ComponentProps) {
  return (
    <AdminPage>
      <AdminHeadline>Odkazy</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton
          to={href(
            '/administration/podcasts/:podcastId/episodes/:episodeId/links/add-link',
            {
              episodeId: loaderData.episode.id,
              podcastId: loaderData.podcast.id,
            },
          )}
        >
          Přidat odkaz
        </AdminLinkButton>
      )}
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>Štítek</TableHeaderCell>
          <TableHeaderCell>URL</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {loaderData.episode.links.map((link) => (
            <ItemRow
              canDelete={link.canDelete}
              canEdit={link.canEdit}
              canView={link.canView}
              episodeId={loaderData.episode.id}
              id={link.id}
              key={link.id}
              label={link.label}
              podcastId={loaderData.podcast.id}
              url={link.url}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
