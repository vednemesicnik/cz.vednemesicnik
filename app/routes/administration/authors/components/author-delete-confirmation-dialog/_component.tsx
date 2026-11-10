import type { RefObject } from 'react'

import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminDeleteConfirmationDialogActions } from '~/components/admin/admin-delete-confirmation-dialog-actions'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'

import { AUTHOR_RECORD_COPY } from '../../author-record-copy'

type Props = {
  ref: RefObject<HTMLDialogElement | null>
  /** The author's name, in the 1st case. */
  name: string
}

/**
 * Confirms deleting an author nothing holds (design 28g, h2twqjee, jh9c3a7n;
 * copy 0t7rbimg), from the list row and the detail alike: no content loses
 * the name, so the dialog says only that the author goes.
 */
export const AuthorDeleteConfirmationDialog = ({ ref, name }: Props) => (
  <AdminDeleteConfirmationDialog ref={ref}>
    <AdminModalTitle>{AUTHOR_RECORD_COPY.deleteTitle(name)}</AdminModalTitle>
    <AdminModalDescription>
      {AUTHOR_RECORD_COPY.deleteDescription}
    </AdminModalDescription>
    <AdminDeleteConfirmationDialogActions>
      {AUTHOR_RECORD_COPY.deleteConfirmLabel}
    </AdminDeleteConfirmationDialogActions>
  </AdminDeleteConfirmationDialog>
)
