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
import { ItemRow } from "~/routes/administration/editorial-board/members/_index/components/item-row"

import type { Route } from "./+types/route"

export { loader } from "./_loader"
export { meta } from "./_meta"

export default function Route({ loaderData }: Route.ComponentProps) {
  return (
    <AdminPage>
      <AdminHeadline>Členové</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton
          to={href("/administration/editorial-board/members/add-member")}
        >
          Přidat člena
        </AdminLinkButton>
      )}
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>Jméno</TableHeaderCell>
          <TableHeaderCell>Pozice</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {loaderData.members.map((member) => (
            <ItemRow
              key={member.id}
              id={member.id}
              fullName={member.fullName}
              positions={member.positions}
              state={member.state}
              canView={member.canView}
              canEdit={member.canEdit}
              canDelete={member.canDelete}
            />
          ))}
        </TableBody>
      </AdminTable>
    </AdminPage>
  )
}
