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
  type TableRowTint,
  TableSelectionCell,
} from '~/components/admin/admin-table'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { VisibilityIcon } from '~/components/icons/visibility-icon'
import { LinkButton } from '~/components/link-button'
import { StatusTag, type StatusTagState } from '~/components/status-tag'
import { getFormattedDateString } from '~/utils/get-formatted-date-string'
import { DIALOG_OPENER_STATE } from '../../../../utils/dialog-opener-state'

type Props = {
  id: string
  name: string
  state: StatusTagState
  createdAt: Date
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  selected: boolean
  onSelect: () => void
  tint?: TableRowTint
}

export const ItemRow = ({
  id,
  name,
  state,
  createdAt,
  canView,
  canEdit,
  canDelete,
  selected,
  onSelect,
  tint,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const fetcherKey = `delete-article-category-${id}`

  const fetcher = useFetcher({ key: fetcherKey })
  const isDeleting = fetcher.state !== 'idle'

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: href('/administration/articles/categories/:categoryId', {
      categoryId: id,
    }),
    key: fetcherKey,
  })

  return (
    <TableRow tint={tint}>
      <TableSelectionCell
        checked={selected}
        disabled={!canDelete}
        label={`Vybrat rubriku ${name}`}
        onChange={onSelect}
      />
      <TableCell>{name}</TableCell>
      <TableCell>{getFormattedDateString(createdAt)}</TableCell>
      <TableCell>
        <StatusTag state={state} />
      </TableCell>
      <TableCell variant={'actions'}>
        <AdminActionGroup>
          {canView && (
            <LinkButton
              disabled={isDeleting}
              to={href('/administration/articles/categories/:categoryId', {
                categoryId: id,
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
              state={DIALOG_OPENER_STATE}
              to={href('/administration/articles/categories/:categoryId/edit', {
                categoryId: id,
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
