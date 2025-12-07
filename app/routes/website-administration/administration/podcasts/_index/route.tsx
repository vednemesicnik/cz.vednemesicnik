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
import { AdminStateBadge } from "~/components/admin-state-badge"
import {
  AdminTable,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "~/components/admin-table"
import { AdministrationPage } from "~/components/administration-page"
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
    <AdministrationPage>
      <AdminHeadline>Podcasty</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton to={href("/administration/podcasts/add-podcast")}>
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
          {loaderData.podcasts.map((podcast) => {
            return (
              <TableRow key={podcast.id}>
                <TableCell>{podcast.title}</TableCell>
                <TableCell>
                  <AdminStateBadge state={podcast.state} />
                </TableCell>
                <TableCell>
                  <AdminActionGroup>
                    {podcast.canView && (
                      <AdminLinkButton
                        to={href("/administration/podcasts/:podcastId", {
                          podcastId: podcast.id,
                        })}
                      >
                        <VisibilityIcon />
                        Zobrazit
                      </AdminLinkButton>
                    )}
                    {podcast.canEdit && (
                      <AdminLinkButton
                        to={href(
                          "/administration/podcasts/:podcastId/edit-podcast",
                          {
                            podcastId: podcast.id,
                          }
                        )}
                      >
                        <EditIcon />
                        Upravit
                      </AdminLinkButton>
                    )}
                    {podcast.canDelete && (
                      <AdminActionButton
                        action={"delete"}
                        onClick={openModal(podcast.id)}
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
    </AdministrationPage>
  )
}