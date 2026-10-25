import type { RefObject } from 'react'

import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'

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
  <AdminDeleteConfirmationDialog
    confirmLabel={AUTHOR_RECORD_COPY.deleteConfirmLabel}
    description={AUTHOR_RECORD_COPY.deleteDescription}
    ref={ref}
    title={AUTHOR_RECORD_COPY.deleteTitle(name)}
  />
)
