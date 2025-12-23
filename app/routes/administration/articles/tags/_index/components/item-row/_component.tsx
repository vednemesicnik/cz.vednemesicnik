import type { ContentState } from '@generated/prisma/enums'
import { useRef } from 'react'
import { href, useFetcher } from 'react-router'
import { AdminActionButton } from '~/components/admin-action-button'
import { AdminActionGroup } from '~/components/admin-action-group'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin-delete-confirmation-dialog'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminStateBadge } from '~/components/admin-state-badge'
import { TableCell, TableRow } from '~/components/admin-table'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { VisibilityIcon } from '~/components/icons/visibility-icon'

type Props = {
  id: string
  name: string
  state: ContentState
  canView: boolean
  canEdit: boolean
  canDelete: boolean
}

export const ItemRow = ({
  id,
  name,
  state,
  canView,
  canEdit,
  canDelete,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const fetcherKey = `delete-article-tag-${id}`

  const fetcher = useFetcher({ key: fetcherKey })
  const isDeleting = fetcher.state !== 'idle'

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: href('/administration/articles/tags/:tagId', { tagId: id }),
    key: fetcherKey,
  })

  return (
    <TableRow>
      <TableCell>{name}</TableCell>
      <TableCell>
        <AdminStateBadge state={state} />
      </TableCell>
      <TableCell>
        <AdminActionGroup>
          {canView && (
            <AdminLinkButton
              disabled={isDeleting}
              to={href('/administration/articles/tags/:tagId', { tagId: id })}
            >
              <VisibilityIcon />
              Zobrazit
            </AdminLinkButton>
          )}
          {canEdit && (
            <AdminLinkButton
              disabled={isDeleting}
              to={href('/administration/articles/tags/:tagId/edit-tag', {
                tagId: id,
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
