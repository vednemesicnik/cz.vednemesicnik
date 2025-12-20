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
import { ItemRow } from "~/routes/administration/editorial-board/positions/_index/components/item-row"

import type { Route } from "./+types/route"

export { loader } from "./_loader"
export { meta } from "./_meta"

export default function Route({ loaderData }: Route.ComponentProps) {
  return (
    <AdminPage>
      <AdminHeadline>Pozice</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton
          to={href("/administration/editorial-board/positions/add-position")}
        >
          Přidat pozici
        </AdminLinkButton>
      )}
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>Klíč</TableHeaderCell>
          <TableHeaderCell>Označení v množném čísle</TableHeaderCell>
          <TableHeaderCell>Pořadí</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {loaderData.positions.map((position) => (
            <ItemRow
              key={position.id}
              id={position.id}
              keyValue={position.key}
              pluralLabel={position.pluralLabel}
              order={position.order}
              state={position.state}
              canView={position.canView}
              canEdit={position.canEdit}
              canDelete={position.canDelete}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
