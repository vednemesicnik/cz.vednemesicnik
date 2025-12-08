// noinspection JSUnusedGlobalSymbols

import { href } from "react-router"

import { AdminActionButton } from "~/components/admin-action-button"
import { AdminActionGroup } from "~/components/admin-action-group"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/admin-delete-confirmation-modal"
import { AdminHeadline } from "~/components/admin-headline"
import { AdminLinkButton } from "~/components/admin-link-button"
import { AdminPage } from "~/components/admin-page"
import { AdminStateBadge } from "~/components/admin-state-badge"
import {
  AdminTable,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "~/components/admin-table"
import { DeleteIcon } from "~/components/icons/delete-icon"
import { EditIcon } from "~/components/icons/edit-icon"
import { VisibilityIcon } from "~/components/icons/visibility-icon"

import type { Route } from "./+types/route"

export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"

export default function Route({ loaderData }: Route.ComponentProps) {
  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  return (
    <AdminPage>
      <AdminHeadline>Archiv</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton to={href("/administration/archive/add-issue")}>
          Přidat číslo
        </AdminLinkButton>
      )}
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>Název</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {loaderData.issues.map((issue) => {
            return (
              <TableRow key={issue.id}>
                <TableCell>{issue.label}</TableCell>
                <TableCell>
                  <AdminStateBadge state={issue.state} />
                </TableCell>
                <TableCell>
                  <AdminActionGroup>
                    {issue.canView && (
                      <AdminLinkButton
                        to={href("/administration/archive/:issueId", {
                          issueId: issue.id,
                        })}
                      >
                        <VisibilityIcon />
                        Zobrazit
                      </AdminLinkButton>
                    )}
                    {issue.canEdit && (
                      <AdminLinkButton
                        to={href(
                          "/administration/archive/:issueId/edit-issue",
                          {
                            issueId: issue.id,
                          }
                        )}
                      >
                        <EditIcon />
                        Upravit
                      </AdminLinkButton>
                    )}
                    {issue.canDelete && (
                      <AdminActionButton
                        action={"delete"}
                        onClick={openModal(issue.id)}
                      >
                        <DeleteIcon />
                        Smazat
                      </AdminActionButton>
                    )}
                  </AdminActionGroup>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </AdminTable>
      <DeleteConfirmationModal
        id={idForDeletion}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </AdminPage>
  )
}
