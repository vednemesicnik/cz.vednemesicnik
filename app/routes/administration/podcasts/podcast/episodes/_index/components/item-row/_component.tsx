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
import { getFormattedDateString } from '~/utils/get-formatted-date-string'

type Props = {
  podcastId: string
  id: string
  title: string
  state: StatusTagState
  createdAt: Date
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  selected: boolean
  onSelect: () => void
}

export const ItemRow = ({
  podcastId,
  id,
  title,
  state,
  createdAt,
  canView,
  canEdit,
  canDelete,
  selected,
  onSelect,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const fetcherKey = `delete-episode-${id}`

  const fetcher = useFetcher({ key: fetcherKey })
  const isDeleting = fetcher.state !== 'idle'

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: href('/administration/podcasts/:podcastId/episodes/:episodeId', {
      episodeId: id,
      podcastId,
    }),
    key: fetcherKey,
  })

  return (
    <TableRow>
      <TableSelectionCell
        checked={selected}
        disabled={!canDelete}
        label={`Vybrat epizodu ${title}`}
        onChange={onSelect}
      />
      <TableCell>{title}</TableCell>
      <TableCell>{getFormattedDateString(createdAt)}</TableCell>
      <TableCell>
        <StatusTag state={state} />
      </TableCell>
      <TableCell variant={'actions'}>
        <AdminActionGroup>
          {canView && (
            <LinkButton
              disabled={isDeleting}
              to={href(
                '/administration/podcasts/:podcastId/episodes/:episodeId',
                { episodeId: id, podcastId },
              )}
              variant={'outline'}
            >
              <VisibilityIcon />
              Zobrazit
            </LinkButton>
          )}
          {canEdit && (
            <LinkButton
              disabled={isDeleting}
              to={href(
                '/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode',
                { episodeId: id, podcastId },
              )}
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
