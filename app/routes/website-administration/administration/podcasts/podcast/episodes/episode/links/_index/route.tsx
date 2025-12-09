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
          {loaderData.episode.links.map((link) => {
            return (
              <TableRow key={link.id}>
                <TableCell>{link.label}</TableCell>
                <TableCell>{link.url}</TableCell>
                <TableCell>
                  <AdminActionGroup>
                    {link.canView && (
                      <AdminLinkButton
                        to={href(
                          "/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId",
                          {
                            podcastId: loaderData.podcast.id,
                            episodeId: loaderData.episode.id,
                            linkId: link.id,
                          }
                        )}
                      >
                        <VisibilityIcon />
                        Zobrazit
                      </AdminLinkButton>
                    )}
                    {link.canEdit && (
                      <AdminLinkButton
                        to={href(
                          "/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId/edit-link",
                          {
                            podcastId: loaderData.podcast.id,
                            episodeId: loaderData.episode.id,
                            linkId: link.id,
                          }
                        )}
                      >
                        <EditIcon />
                        Upravit
                      </AdminLinkButton>
                    )}
                    {link.canDelete && (
                      <AdminActionButton
                        action={"delete"}
                        onClick={openModal(link.id)}
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
