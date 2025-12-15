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
import { ItemRow } from "~/routes/administration/podcasts/podcast/episodes/_index/components/item-row"

import type { Route } from "./+types/route"

export { loader } from "./_loader"
export { meta } from "./_meta"

export default function Route({ loaderData }: Route.ComponentProps) {
  return (
    <AdminPage>
      <AdminHeadline>Epizody</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton
          to={href("/administration/podcasts/:podcastId/episodes/add-episode", {
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
              key={episode.id}
              podcastId={loaderData.podcast.id}
              id={episode.id}
              title={episode.title}
              state={episode.state}
              canView={episode.canView}
              canEdit={episode.canEdit}
              canDelete={episode.canDelete}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
