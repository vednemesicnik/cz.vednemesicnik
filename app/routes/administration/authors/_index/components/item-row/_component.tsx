import { useRef } from 'react'
import { href, useFetcher } from 'react-router'

import { AdminActionButton } from '~/components/admin/admin-action-button'
import { AdminActionGroup } from '~/components/admin/admin-action-group'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import {
  TableCell,
  TableRow,
  TableSelectionCell,
} from '~/components/admin/admin-table'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { VisibilityIcon } from '~/components/icons/visibility-icon'
import { getFormattedDateString } from '~/utils/get-formatted-date-string'

type Props = {
  id: string
  name: string
  roleName: string
  userEmail: string | null
  createdAt: Date
  canView: boolean
  canUpdate: boolean
  canDelete: boolean
  selected: boolean
  onSelect: () => void
}

export const ItemRow = ({
  id,
  name,
  roleName,
  userEmail,
  createdAt,
  canView,
  canUpdate,
  canDelete,
  selected,
  onSelect,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const fetcherKey = `delete-author-${id}`

  const fetcher = useFetcher({ key: fetcherKey })
  const isDeleting = fetcher.state !== 'idle'

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: href('/administration/authors/:authorId', { authorId: id }),
    key: fetcherKey,
  })

  return (
    <TableRow>
      <TableSelectionCell
        checked={selected}
        disabled={!canDelete}
        label={`Vybrat autora ${name}`}
        onChange={onSelect}
      />
      <TableCell>{name}</TableCell>
      <TableCell>{roleName}</TableCell>
      <TableCell>{userEmail ?? '—'}</TableCell>
      <TableCell>{getFormattedDateString(createdAt)}</TableCell>
      <TableCell variant={'actions'}>
        <AdminActionGroup>
          {canView && (
            <AdminLinkButton
              disabled={isDeleting}
              to={href('/administration/authors/:authorId', { authorId: id })}
            >
              <VisibilityIcon />
              Zobrazit
            </AdminLinkButton>
          )}
          {canUpdate && (
            <AdminLinkButton
              disabled={isDeleting}
              to={href('/administration/authors/:authorId/edit-author', {
                authorId: id,
              })}
            >
              <EditIcon />
              Upravit
            </AdminLinkButton>
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
