import { useRef, useState } from 'react'
import { href, useFetcher } from 'react-router'

import { AdminActionButton } from '~/components/admin/admin-action-button'
import { AdminActionGroup } from '~/components/admin/admin-action-group'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import {
  TableCell,
  TableRow,
  TableSelectionCell,
} from '~/components/admin/admin-table'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { VisibilityIcon } from '~/components/icons/visibility-icon'
import { LinkButton } from '~/components/link-button'
import type { AuthorDeleteBlock } from '~/utils/author-references/get-author-delete-block'
import { getFormattedDateString } from '~/utils/get-formatted-date-string'

import { AuthorDeleteBlockedDialog } from '../../../components/author-delete-blocked-dialog'
import { useAuthorDeleteRefusal } from '../../../utils/use-author-delete-refusal'

type Props = {
  id: string
  name: string
  roleName: string
  userEmail: string | null
  createdAt: Date
  canView: boolean
  canUpdate: boolean
  canDelete: boolean
  mayDelete: boolean
  deleteBlock: AuthorDeleteBlock
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
  mayDelete,
  deleteBlock,
  selected,
  onSelect,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [isBlockedDialogOpen, setIsBlockedDialogOpen] = useState(false)
  const fetcherKey = `delete-author-${id}`

  const fetcher = useFetcher({ key: fetcherKey })
  const isDeleting = fetcher.state !== 'idle'
  const { dismiss, refusal } = useAuthorDeleteRefusal(fetcherKey)

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
            <LinkButton
              disabled={isDeleting}
              to={href('/administration/authors/:authorId', { authorId: id })}
              variant={'outline'}
            >
              <VisibilityIcon />
              Zobrazit
            </LinkButton>
          )}
          {canUpdate && (
            <LinkButton
              disabled={isDeleting}
              to={href('/administration/authors/:authorId/edit-author', {
                authorId: id,
              })}
              variant={'outline'}
            >
              <EditIcon />
              Upravit
            </LinkButton>
          )}
          {/* A blocked author gets the 28g explanation in place of the confirmation. */}
          {mayDelete && (
            <>
              <AdminActionButton
                action={'delete'}
                disabled={isDeleting}
                onClick={
                  canDelete ? openDialog : () => setIsBlockedDialogOpen(true)
                }
              >
                <DeleteIcon />
                {isDeleting ? 'Maže se...' : 'Smazat'}
              </AdminActionButton>
              <AdminDeleteConfirmationDialog ref={dialogRef} />
              {(isBlockedDialogOpen || refusal !== null) && (
                <AuthorDeleteBlockedDialog
                  block={refusal ?? deleteBlock}
                  name={name}
                  onClose={() => {
                    setIsBlockedDialogOpen(false)
                    dismiss()
                  }}
                />
              )}
            </>
          )}
        </AdminActionGroup>
      </TableCell>
    </TableRow>
  )
}
