import { useRef } from "react"
import { href } from "react-router"

import type { ContentState } from "@generated/prisma/enums"
import { AdminActionButton } from "~/components/admin-action-button"
import { AdminActionGroup } from "~/components/admin-action-group"
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from "~/components/admin-delete-confirmation-dialog"
import { AdminLinkButton } from "~/components/admin-link-button"
import { AdminStateBadge } from "~/components/admin-state-badge"
import { TableCell, TableRow } from "~/components/admin-table"
import { DeleteIcon } from "~/components/icons/delete-icon"
import { EditIcon } from "~/components/icons/edit-icon"
import { VisibilityIcon } from "~/components/icons/visibility-icon"

type Props = {
  podcastId: string
  id: string
  title: string
  state: ContentState
  canView: boolean
  canEdit: boolean
  canDelete: boolean
}

export const ItemRow = ({
  podcastId,
  id,
  title,
  state,
  canView,
  canEdit,
  canDelete,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: href(
      "/administration/podcasts/:podcastId/episodes/:episodeId",
      { podcastId, episodeId: id }
    ),
  })

  return (
    <TableRow>
      <TableCell>{title}</TableCell>
      <TableCell>
        <AdminStateBadge state={state} />
      </TableCell>
      <TableCell>
        <AdminActionGroup>
          {canView && (
            <AdminLinkButton
              to={href(
                "/administration/podcasts/:podcastId/episodes/:episodeId",
                { podcastId, episodeId: id }
              )}
            >
              <VisibilityIcon />
              Zobrazit
            </AdminLinkButton>
          )}
          {canEdit && (
            <AdminLinkButton
              to={href(
                "/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode",
                { podcastId, episodeId: id }
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