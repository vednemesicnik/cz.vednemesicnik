// noinspection JSUnusedGlobalSymbols

import { href } from "react-router"

import { AdminHeadline } from "~/components/admin-headline"
import { AdminLinkButton } from "~/components/admin-link-button"
import { AdminPage } from "~/components/admin-page"
import {
  AdminTable,
  TableBody,
  TableHeader,
  TableHeaderCell,
} from "~/components/admin-table"
import { ItemRow } from "~/routes/administration/podcasts/podcast/episodes/episode/links/_index/components/item-row"

import type { Route } from "./+types/route"

export { loader } from "./_loader"
export { meta } from "./_meta"

export default function Route({ loaderData }: Route.ComponentProps) {
  return (
    <AdminPage>
      <AdminHeadline>Odkazy</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton
          to={href(
            "/administration/podcasts/:podcastId/episodes/:episodeId/links/add-link",
            {
              podcastId: loaderData.podcast.id,
              episodeId: loaderData.episode.id,
            }
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
              key={link.id}
              podcastId={loaderData.podcast.id}
              episodeId={loaderData.episode.id}
              id={link.id}
              label={link.label}
              url={link.url}
              canView={link.canView}
              canEdit={link.canEdit}
              canDelete={link.canDelete}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}