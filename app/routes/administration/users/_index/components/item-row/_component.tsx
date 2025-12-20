import { useRef } from 'react'
import { href } from 'react-router'

import { AdminActionButton } from '~/components/admin-action-button'
import { AdminActionGroup } from '~/components/admin-action-group'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin-delete-confirmation-dialog'
import { AdminLinkButton } from '~/components/admin-link-button'
import { TableCell, TableRow } from '~/components/admin-table'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { VisibilityIcon } from '~/components/icons/visibility-icon'

type Props = {
  id: string
  email: string
  username: string
  name: string | null
  roleName: string
  canView: boolean
  canUpdate: boolean
  canDelete: boolean
}

export const ItemRow = ({
  id,
  email,
  username,
  name,
  roleName,
  canView,
  canUpdate,
  canDelete,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: href('/administration/users/:userId', { userId: id }),
  })

  return (
    <TableRow>
      <TableCell>{email}</TableCell>
      <TableCell>{username}</TableCell>
      <TableCell>{name ?? '...'}</TableCell>
      <TableCell>{roleName}</TableCell>
      <TableCell>
        <AdminActionGroup>
          {canView && (
            <AdminLinkButton
              to={href('/administration/users/:userId', { userId: id })}
            >
              <VisibilityIcon />
              Zobrazit
            </AdminLinkButton>
          )}
          {canUpdate && (
            <AdminLinkButton
              to={href('/administration/users/:userId/edit-user', {
                userId: id,
              })}
            >
              <EditIcon />
              Upravit
            </AdminLinkButton>
          )}
          {canDelete && (
            <>
              <AdminActionButton action={'delete'} onClick={openDialog}>
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
