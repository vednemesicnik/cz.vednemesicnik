import type { ContentState } from '@generated/prisma/enums'
import { useRef } from 'react'
import { href, useFetcher } from 'react-router'
import { AdminActionButton } from '~/components/admin/admin-action-button'
import { AdminActionGroup } from '~/components/admin/admin-action-group'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { AdminStateBadge } from '~/components/admin/admin-state-badge'
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
  label: string
  state: ContentState
  createdAt: Date
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  selected: boolean
  onSelect: () => void
}

export const ItemRow = ({
  id,
  label,
  state,
  createdAt,
  canView,
  canEdit,
  canDelete,
  selected,
  onSelect,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const fetcherKey = `delete-issue-${id}`

  const fetcher = useFetcher({ key: fetcherKey })
  const isDeleting = fetcher.state !== 'idle'

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: href('/administration/archive/:issueId', { issueId: id }),
    key: fetcherKey,
  })

  return (
    <TableRow>
      <TableSelectionCell
        checked={selected}
        disabled={!canDelete}
        label={`Vybrat číslo ${label}`}
        onChange={onSelect}
      />
      <TableCell>{label}</TableCell>
      <TableCell>{getFormattedDateString(createdAt)}</TableCell>
      <TableCell>
        <AdminStateBadge state={state} />
      </TableCell>
      <TableCell variant={'actions'}>
        <AdminActionGroup>
          {canView && (
            <AdminLinkButton
              disabled={isDeleting}
              to={href('/administration/archive/:issueId', {
                issueId: id,
              })}
            >
              <VisibilityIcon />
              Zobrazit
            </AdminLinkButton>
          )}
          {canEdit && (
            <AdminLinkButton
              disabled={isDeleting}
              to={href('/administration/archive/:issueId/edit-issue', {
                issueId: id,
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
