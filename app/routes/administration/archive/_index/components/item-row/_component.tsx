import { useRef } from "react"
import { href, useFetcher } from "react-router"

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
  label: string
  state: ContentState
  canView: boolean
  canEdit: boolean
  canDelete: boolean
}

export const ItemRow = ({
  id,
  label,
  state,
  canView,
  canEdit,
  canDelete,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const fetcherKey = `delete-issue-${id}`

  const fetcher = useFetcher({ key: fetcherKey })
  const isDeleting = fetcher.state !== "idle"

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: href("/administration/archive/:issueId", { issueId: id }),
    key: fetcherKey,
  })

  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell>
        <AdminStateBadge state={state} />
      </TableCell>
      <TableCell>
        <AdminActionGroup>
          {canView && (
            <AdminLinkButton
              to={href("/administration/archive/:issueId", {
                issueId: id,
              })}
              disabled={isDeleting}
            >
              <VisibilityIcon />
              Zobrazit
            </AdminLinkButton>
          )}
          {canEdit && (
            <AdminLinkButton
              to={href("/administration/archive/:issueId/edit-issue", {
                issueId: id,
              })}
              disabled={isDeleting}
            >
              <EditIcon />
              Upravit
            </AdminLinkButton>
          )}
          {canDelete && (
            <>
              <AdminActionButton
                action={"delete"}
                onClick={openDialog}
                disabled={isDeleting}
              >
                <DeleteIcon />
                {isDeleting ? "Mažu..." : "Smazat"}
              </AdminActionButton>
              <AdminDeleteConfirmationDialog ref={dialogRef} />
            </>
          )}
        </AdminActionGroup>
      </TableCell>
    </TableRow>
  )
}
