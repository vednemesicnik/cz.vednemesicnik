import { useRef } from 'react'
import { href, useFetcher } from 'react-router'

import { AdminActionButton } from '~/components/admin/admin-action-button'
import { AdminActionGroup } from '~/components/admin/admin-action-group'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import { TableCell, TableRow } from '~/components/admin/admin-table'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { VisibilityIcon } from '~/components/icons/visibility-icon'
import { LinkButton } from '~/components/link-button'
import { getFormattedDateString } from '~/utils/get-formatted-date-string'

type Props = {
  id: string
  email: string
  name: string
  roleName: string
  createdAt: Date
  canView: boolean
  canUpdate: boolean
  canDelete: boolean
}

export const ItemRow = ({
  id,
  email,
  name,
  roleName,
  createdAt,
  canView,
  canUpdate,
  canDelete,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const fetcherKey = `delete-user-${id}`

  const fetcher = useFetcher({ key: fetcherKey })
  const isDeleting = fetcher.state !== 'idle'

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: href('/administration/users/:userId', { userId: id }),
    key: fetcherKey,
  })

  return (
    <TableRow>
      <TableCell>{email}</TableCell>
      <TableCell>{name}</TableCell>
      <TableCell>{roleName}</TableCell>
      <TableCell>{getFormattedDateString(createdAt)}</TableCell>
      <TableCell variant={'actions'}>
        <AdminActionGroup>
          {canView && (
            <LinkButton
              disabled={isDeleting}
              to={href('/administration/users/:userId', { userId: id })}
              variant={'outline'}
            >
              <VisibilityIcon />
              Zobrazit
            </LinkButton>
          )}
          {canUpdate && (
            <LinkButton
              disabled={isDeleting}
              to={href('/administration/users/:userId/edit-user', {
                userId: id,
              })}
              variant={'outline'}
            >
              <EditIcon />
              Upravit
            </LinkButton>
          )}
          {canDelete && (
            <>
              <AdminActionButton
                action={'delete'}
                disabled={isDeleting}
                onClick={openDialog}
              >
                <DeleteIcon />
                {isDeleting ? 'Maže se...' : 'Smazat'}
              </AdminActionButton>
              <AdminDeleteConfirmationDialog ref={dialogRef} />
            </>
          )}
        </AdminActionGroup>
      </TableCell>
    </TableRow>
  )
}
