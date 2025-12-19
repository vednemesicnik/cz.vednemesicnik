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
  id: string
  name: string
  roleName: string
  userEmail: string | null
  canView: boolean
  canUpdate: boolean
  canDelete: boolean
}

export const ItemRow = ({
  id,
  name,
  roleName,
  userEmail,
  canView,
  canUpdate,
  canDelete,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: href("/administration/authors/:authorId", { authorId: id }),
  })

  return (
    <TableRow>
      <TableCell>{name}</TableCell>
      <TableCell>{roleName}</TableCell>
      <TableCell>{userEmail ?? "—"}</TableCell>
      <TableCell>
        <AdminActionGroup>
          {canView && (
            <AdminLinkButton
              to={href("/administration/authors/:authorId", { authorId: id })}
            >
              <VisibilityIcon />
              Zobrazit
            </AdminLinkButton>
          )}
          {canUpdate && (
            <AdminLinkButton
              to={href("/administration/authors/:authorId/edit-author", {
                authorId: id,
              })}
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
