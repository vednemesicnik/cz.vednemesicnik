import { useRef } from 'react'
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
import { StatusTag, type StatusTagState } from '~/components/status-tag'
import { useContentActionResult } from '~/hooks/use-content-action-result'
import { getFormattedDateString } from '~/utils/get-formatted-date-string'

import type { action as issueAction } from '../../../issue/_index/_action'

type Props = {
  id: string
  title: string
  orderLabel: string | null
  state: StatusTagState
  createdAt: Date
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  selected: boolean
  onSelect: () => void
}

export const ItemRow = ({
  id,
  title,
  orderLabel,
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

  const fetcher = useFetcher<typeof issueAction>({ key: fetcherKey })
  const isDeleting = fetcher.state !== 'idle'
  // A delete the edit hold refused says who edits the issue (26i).
  useContentActionResult(fetcher.data, { heldSubject: 'číslo' })

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: href('/administration/archive/:issueId', { issueId: id }),
    key: fetcherKey,
  })

  return (
    <TableRow>
      <TableSelectionCell
        checked={selected}
        disabled={!canDelete}
        label={`Vybrat číslo ${title}`}
        onChange={onSelect}
      />
      <TableCell>{title}</TableCell>
      <TableCell>{orderLabel ?? '—'}</TableCell>
      <TableCell>{getFormattedDateString(createdAt)}</TableCell>
      <TableCell>
        <StatusTag state={state} />
      </TableCell>
      <TableCell variant={'actions'}>
        <AdminActionGroup>
          {canView && (
            <LinkButton
              disabled={isDeleting}
              to={href('/administration/archive/:issueId', {
                issueId: id,
              })}
              variant={'outline'}
            >
              <VisibilityIcon />
              Zobrazit
            </LinkButton>
          )}
          {canEdit && (
            <LinkButton
              disabled={isDeleting}
              to={href('/administration/archive/:issueId/edit-issue', {
                issueId: id,
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
