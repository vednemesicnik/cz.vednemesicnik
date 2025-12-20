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
  id: string
  fullName: string
  positions: string
  state: ContentState
  canView: boolean
  canEdit: boolean
  canDelete: boolean
}

export const ItemRow = ({
  id,
  fullName,
  positions,
  state,
  canView,
  canEdit,
  canDelete,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: href("/administration/editorial-board/members/:memberId", {
      memberId: id,
    }),
  })

  return (
    <TableRow>
      <TableCell>{fullName}</TableCell>
      <TableCell>{positions}</TableCell>
      <TableCell>
        <AdminStateBadge state={state} />
      </TableCell>
      <TableCell>
        <AdminActionGroup>
          {canView && (
            <AdminLinkButton
              to={href("/administration/editorial-board/members/:memberId", {
                memberId: id,
              })}
            >
              <VisibilityIcon />
              Zobrazit
            </AdminLinkButton>
          )}
          {canEdit && (
            <AdminLinkButton
              to={href(
                "/administration/editorial-board/members/:memberId/edit-member",
                {
                  memberId: id,
                }
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
