import { useRef } from "react"
import { href } from "react-router"

import { AdminActionButton } from "~/components/admin-action-button"
import { AdminActionGroup } from "~/components/admin-action-group"
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from "~/components/admin-delete-confirmation-dialog"
import { AdminLinkButton } from "~/components/admin-link-button"
import { TableCell, TableRow } from "~/components/admin-table"
import { DeleteIcon } from "~/components/icons/delete-icon"
import { EditIcon } from "~/components/icons/edit-icon"
import { VisibilityIcon } from "~/components/icons/visibility-icon"

type Props = {
  podcastId: string
  episodeId: string
  id: string
  label: string
  url: string
  canView: boolean
  canEdit: boolean
  canDelete: boolean
}

export const ItemRow = ({
  podcastId,
  episodeId,
  id,
  label,
  url,
  canView,
  canEdit,
  canDelete,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: href(
      "/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId",
      { podcastId, episodeId, linkId: id }
    ),
  })

  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell>{url}</TableCell>
      <TableCell>
        <AdminActionGroup>
          {canView && (
            <AdminLinkButton
              to={href(
                "/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId",
                { podcastId, episodeId, linkId: id }
              )}
            >
              <VisibilityIcon />
              Zobrazit
            </AdminLinkButton>
          )}
          {canEdit && (
            <AdminLinkButton
              to={href(
                "/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId/edit-link",
                { podcastId, episodeId, linkId: id }
              )}
            >
              <EditIcon />
              Upravit
            </AdminLinkButton>
          )}
          {canDelete && (
            <>
              <AdminActionButton action={"delete"} onClick={openDialog}>
                <DeleteIcon />
                Smazat
              </AdminActionButton>
              <AdminDeleteConfirmationDialog ref={dialogRef} />
            </>
          )}
        </AdminActionGroup>
      </TableCell>
    </TableRow>
  )
}
