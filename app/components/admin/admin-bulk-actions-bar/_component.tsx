import { useRef } from 'react'

import { AdminActionButton } from '~/components/admin/admin-action-button'
import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import { DeleteIcon } from '~/components/icons/delete-icon'

import { useAdminBulkDelete } from './_hook'
import styles from './_styles.module.css'

type Props = {
  // Route action URL (the list route itself).
  action: string
  selectedIds: string[]
  // Clear the selection after a successful submit.
  onDone: () => void
}

export const AdminBulkActionsBar = ({ action, selectedIds, onDone }: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  const { isSubmitting, openDialog } = useAdminBulkDelete(dialogRef, {
    action,
    onDone,
    selectedIds,
  })

  return (
    <>
      {selectedIds.length > 0 && (
        <section aria-label={'Hromadné akce'} className={styles.bar}>
          <span className={styles.count}>Vybráno: {selectedIds.length}</span>
          <AdminActionButton
            action={'delete'}
            disabled={isSubmitting}
            onClick={openDialog}
            type={'button'}
          >
            <DeleteIcon />
            {isSubmitting ? 'Maže se...' : 'Smazat vybrané'}
          </AdminActionButton>
        </section>
      )}
      {/* Keep the dialog mounted even with no selection: the hook attaches its
          `close` listener on mount, so a dialog that only appears on selection
          would never wire up and confirm would never submit. */}
      <AdminDeleteConfirmationDialog ref={dialogRef} />
    </>
  )
}
