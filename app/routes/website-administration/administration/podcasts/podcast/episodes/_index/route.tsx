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

export { action } from "./_action"
export { loader } from "./_loader"
export { meta } from "./_meta"

export default function Route({ loaderData }: Route.ComponentProps) {
  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  return (
    <AdminPage>
      <AdminHeadline>Epizody</AdminHeadline>
      {loaderData.canCreate && (
        <AdminLinkButton
          to={href(
            "/administration/podcasts/:podcastId/episodes/add-episode",
            {
              podcastId: loaderData.podcast.id,
            }
          )}
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
          {loaderData.podcast.episodes.map((episode) => {
            return (
              <TableRow key={episode.id}>
                <TableCell>{episode.title}</TableCell>
                <TableCell>
                  <AdminStateBadge state={episode.state} />
                </TableCell>
                <TableCell>
                  <AdminActionGroup>
                    {episode.canView && (
                      <AdminLinkButton
                        to={href(
                          "/administration/podcasts/:podcastId/episodes/:episodeId",
                          {
                            podcastId: loaderData.podcast.id,
                            episodeId: episode.id,
                          }
                        )}
                      >
                        <VisibilityIcon />
                        Zobrazit
                      </AdminLinkButton>
                    )}
                    {episode.canEdit && (
                      <AdminLinkButton
                        to={href(
                          "/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode",
                          {
                            podcastId: loaderData.podcast.id,
                            episodeId: episode.id,
                          }
                        )}
                      >
                        <EditIcon />
                        Upravit
                      </AdminLinkButton>
                    )}
                    {episode.canDelete && (
                      <AdminActionButton
                        action={"delete"}
                        onClick={openModal(episode.id)}
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